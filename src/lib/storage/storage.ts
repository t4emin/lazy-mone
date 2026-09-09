import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export interface AssetStorage {
  put(
    data: Buffer,
    extension: "jpg" | "png" | "webp" | "mp4" | "mp3",
  ): Promise<string>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

class LocalAssetStorage implements AssetStorage {
  private root = resolve(process.cwd(), ".data/uploads");
  private path(key: string) {
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp|mp4|mp3)$/.test(key))
      throw new Error("Invalid storage key");
    return join(this.root, key);
  }
  async put(data: Buffer, extension: "jpg" | "png" | "webp" | "mp4" | "mp3") {
    const key = `${randomUUID()}.${extension}`;
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    await writeFile(this.path(key), data, { flag: "wx", mode: 0o600 });
    return key;
  }
  read(key: string) {
    return readFile(this.path(key));
  }
  async remove(key: string) {
    try {
      await unlink(this.path(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

class R2AssetStorage implements AssetStorage {
  private client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  private bucket = process.env.R2_BUCKET!;
  private key(key: string) {
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp|mp4|mp3)$/.test(key))
      throw new Error("Invalid storage key");
    return key;
  }
  async put(data: Buffer, extension: "jpg" | "png" | "webp" | "mp4" | "mp3") {
    const key = `${randomUUID()}.${extension}`;
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data }),
    );
    return key;
  }
  async read(key: string) {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.key(key) }),
    );
    if (!result.Body) throw new Error("Stored asset has no body");
    return Buffer.from(await result.Body.transformToByteArray());
  }
  async remove(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key(key) }),
    );
  }
}

function r2Configured() {
  return [
    process.env.R2_BUCKET,
    process.env.R2_ENDPOINT,
    process.env.R2_ACCESS_KEY_ID,
    process.env.R2_SECRET_ACCESS_KEY,
  ].every((value) => Boolean(value?.trim()));
}

// Replace this factory to use S3-compatible storage; callers only depend on the interface.
export function getAssetStorage(): AssetStorage {
  if (r2Configured()) return new R2AssetStorage();
  return new LocalAssetStorage();
}

export async function removeStoredFiles(keys: string[]) {
  const storage = getAssetStorage();
  const results = await Promise.allSettled(
    keys.map((key) => storage.remove(key)),
  );
  results.forEach((result, index) => {
    if (result.status === "rejected")
      console.error("Unable to remove orphaned product image:", keys[index]);
  });
}
