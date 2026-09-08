import "server-only";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { getDb } from "@/lib/db";
import { ProductError } from "@/lib/products/errors";
import { getAssetStorage } from "@/lib/storage/storage";
import type { ComposeVideoInput } from "./validation";

export function listComposerAssets(userId: string, contentId: string) {
  return getDb().productAsset.findMany({
    where: {
      product: { userId },
      OR: [
        { type: { in: ["product_image", "generated_image"] } },
        { contentId, type: "audio" },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export function listComposedVideos(userId: string, contentId: string) {
  return getDb().productAsset.findMany({
    where: {
      contentId,
      type: "video",
      aiProvider: "internal",
      product: { userId },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.env.FFMPEG_PATH || "ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let errors = "";
    child.stderr.on("data", (chunk) => (errors += chunk));
    child.on("error", () =>
      reject(new ProductError(503, "ไม่พบ FFmpeg ที่ Server")),
    );
    child.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new ProductError(
            502,
            `ประกอบวิดีโอไม่สำเร็จ (${errors.slice(-300)})`,
          ),
        );
    });
  });
}

export async function composeVideo(
  userId: string,
  contentId: string,
  input: ComposeVideoInput,
) {
  const content = await getDb().contentDraft.findFirst({
    where: { id: contentId, userId, product: { userId } },
  });
  if (!content) throw new ProductError(404, "ไม่พบคอนเทนต์");
  const assets = await getDb().productAsset.findMany({
    where: { id: { in: input.imageAssetIds }, productId: content.productId },
  });
  if (
    assets.length !== input.imageAssetIds.length ||
    assets.some(
      (asset) => !["product_image", "generated_image"].includes(asset.type),
    )
  )
    throw new ProductError(400, "รูปสำหรับ Scene ต้องเป็นรูปของสินค้าเดียวกัน");
  const images = input.imageAssetIds.map((id) =>
    assets.find((asset) => asset.id === id)!,
  );
  const audio = input.audioAssetId
    ? await getDb().productAsset.findFirst({
        where: {
          id: input.audioAssetId,
          contentId,
          type: "audio",
          product: { userId },
        },
      })
    : null;
  if (input.audioAssetId && !audio)
    throw new ProductError(400, "เสียงต้องเป็น Audio Asset ของคอนเทนต์นี้");
  const folder = await mkdtemp(join(tmpdir(), "affiliate-compose-"));
  try {
    const imagePaths = await Promise.all(
      images.map(async (asset, index) => {
        const path = join(folder, `scene-${index}.png`);
        await writeFile(path, await getAssetStorage().read(asset.filePath));
        return path;
      }),
    );
    const audioPath = audio ? join(folder, "voice.mp3") : null;
    if (audio && audioPath)
      await writeFile(audioPath, await getAssetStorage().read(audio.filePath));
    const textPath = join(folder, "caption.txt");
    if (input.text) await writeFile(textPath, input.text);
    const [width, height] =
      input.aspectRatio === "9:16" ? [720, 1280] : [1280, 720];
    const duration = input.durationSeconds;
    const filters = imagePaths.map((_, index) => {
      const base = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
      const effect =
        input.effect === "zoom"
          ? `,zoompan=z='min(zoom+0.0008,1.12)':d=${duration * 30}:s=${width}x${height}:fps=30`
          : `,fade=t=in:st=0:d=0.3,fade=t=out:st=${Math.max(0, duration - 0.3)}:d=0.3`;
      return `[${index}:v]${base}${effect},setsar=1[v${index}]`;
    });
    const joined = imagePaths.map((_, index) => `[v${index}]`).join("");
    const textFilter = input.text
      ? `,drawtext=textfile='${textPath.replace(/'/g, "\\\\'")}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h-100:box=1:boxcolor=black@0.45:boxborderw=16`
      : "";
    filters.push(
      `${joined}concat=n=${imagePaths.length}:v=1:a=0${textFilter}[video]`,
    );
    const args = imagePaths.flatMap((path) => [
      "-loop",
      "1",
      "-t",
      String(duration),
      "-i",
      path,
    ]);
    if (audioPath) args.push("-i", audioPath);
    const output = join(folder, "output.mp4");
    args.push(
      "-filter_complex",
      filters.join(";"),
      "-map",
      "[video]",
      ...(audioPath ? ["-map", `${imagePaths.length}:a?`, "-shortest"] : []),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      ...(audioPath ? ["-c:a", "aac"] : []),
      "-movflags",
      "+faststart",
      "-y",
      output,
    );
    await runFfmpeg(args);
    const bytes = await readFile(output);
    const filePath = await getAssetStorage().put(bytes, "mp4");
    return await getDb().productAsset.create({
      data: {
        productId: content.productId,
        contentId,
        type: "video",
        filePath,
        fileName: `composed-${Date.now()}.mp4`,
        mimeType: "video/mp4",
        fileSize: bytes.length,
        prompt: input.text,
        aspectRatio: input.aspectRatio,
        aiProvider: "internal",
        aiModel: "ffmpeg",
      },
    });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}
