import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { findContent } from "@/lib/content/service";
import { ContentEditor } from "@/components/content/content-editor";
import {
  contentTypeLabels,
  targetPlatformLabels,
} from "@/lib/content/validation";
import { displayDate } from "@/lib/products/format";
import { ImageAssets } from "@/components/content/image-assets";
import {
  listContentAssets,
  listContentPreviewAssets,
} from "@/lib/assets/service";
import { getImageAIConfiguration } from "@/lib/ai/ai-service";
import { getVideoAIConfiguration } from "@/lib/ai/ai-service";
import { listVideoJobs } from "@/lib/video/service";
import { VideoJobs } from "@/components/content/video-jobs";
import { AudioAssets } from "@/components/content/audio-assets";
import { getAudioAIConfiguration } from "@/lib/ai/ai-service";
import { listAudioAssets } from "@/lib/audio/service";
import { VideoComposer } from "@/components/content/video-composer";
import { listComposerAssets, listComposedVideos } from "@/lib/composer/service";
import { ContentPreview } from "@/components/content/content-preview";
import { FacebookPublisher } from "@/components/content/facebook-publisher";
import { listSocialAccounts } from "@/lib/social/service";
import { listPublishJobs } from "@/lib/publishing/service";
export default async function ContentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; generated?: string; image?: string }>;
}) {
  const { user } = await requireSession();
  const content = await findContent(user.id, (await params).id);
  if (!content) notFound();
  const query = await searchParams;
  const videoConfiguration = getVideoAIConfiguration();
  const audioConfiguration = getAudioAIConfiguration();
  return (
    <>
      <Link href="/content">← Content</Link>
      <h1>Content Editor</h1>
      <p>
        <Link href={`/products/${content.productId}`}>
          {content.product.name}
        </Link>{" "}
        ·{" "}
        {
          contentTypeLabels[
            content.contentType as keyof typeof contentTypeLabels
          ]
        }{" "}
        ·{" "}
        {
          targetPlatformLabels[
            content.targetPlatform as keyof typeof targetPlatformLabels
          ]
        }
      </p>
      <p className="muted">
        AI: {content.aiProvider} / {content.aiModel} · Created:{" "}
        {displayDate(content.createdAt)} · Updated:{" "}
        {displayDate(content.updatedAt)}
      </p>
      <details className="content-options">
        <summary>ตัวเลือกที่ใช้สร้างคอนเทนต์</summary>
        <p>
          Language: {content.language} · Tone: {content.tone}
        </p>
        <p>Target Audience: {content.targetAudience || "ไม่ได้ระบุ"}</p>
        <p>
          Additional Instructions:{" "}
          {content.additionalInstructions || "ไม่ได้ระบุ"}
        </p>
      </details>
      {(query.saved === "1" || query.generated === "1") && (
        <p className="success" role="status">
          {query.generated === "1"
            ? "สร้างและบันทึกฉบับร่างเริ่มต้นแล้ว แก้ไขและกด Save เพื่อบันทึกการเปลี่ยนแปลง"
            : "บันทึกคอนเทนต์แล้ว"}
        </p>
      )}
      {query.image && (
        <p className="success" role="status">
          สร้างและบันทึกภาพ AI แล้ว
        </p>
      )}
      <ContentEditor
        id={content.id}
        initial={{
          hook: content.hook,
          script: content.script,
          caption: content.caption,
          cta: content.cta,
          hashtags: content.hashtags,
          status: content.status === "ready" ? "ready" : "draft",
          version: content.version,
        }}
      />
      <ContentPreview
        product={{
          id: content.productId,
          name: content.product.name,
          affiliateUrl: content.product.affiliateUrl,
        }}
        content={{
          status: content.status,
          hook: content.hook,
          script: content.script,
          caption: content.caption,
          cta: content.cta,
          hashtags: content.hashtags,
        }}
        assets={[
          ...content.product.assets.map(({ id, fileName, type }) => ({
            id,
            fileName,
            type,
          })),
          ...(await listContentPreviewAssets(user.id, content.id)).map(
            ({ id, fileName, type }) => ({ id, fileName, type }),
          ),
        ]}
      />
      <FacebookPublisher
        contentId={content.id}
        ready={content.status === "ready"}
        accounts={(await listSocialAccounts(user.id))
          .filter(
            (account) =>
              account.platform === "facebook" && account.status === "connected",
          )
          .map(({ id, accountName }) => ({ id, accountName }))}
        initialCaption={[
          content.caption,
          content.hashtags.join(" "),
          content.product.affiliateUrl,
        ]
          .filter(Boolean)
          .join("\n\n")}
        jobs={(await listPublishJobs(user.id, content.id)).map((job) => ({
          ...job,
          scheduledAt: job.scheduledAt ? displayDate(job.scheduledAt) : null,
          cancelledAt: job.cancelledAt ? displayDate(job.cancelledAt) : null,
          publishedAt: job.publishedAt ? displayDate(job.publishedAt) : null,
          createdAt: displayDate(job.createdAt),
        }))}
      />
      <ImageAssets
        contentId={content.id}
        productId={content.productId}
        configured={getImageAIConfiguration().configured}
        references={content.product.assets.map(
          ({ id, fileName, isPrimary, type }) => ({
            id,
            fileName,
            isPrimary,
            type,
          }),
        )}
        initialAssets={await listContentAssets(user.id, content.id)}
      />
      <VideoJobs
        contentId={content.id}
        configured={videoConfiguration.configured}
        provider={videoConfiguration.provider}
        model={videoConfiguration.model}
        assets={content.product.assets.map(({ id, fileName, type }) => ({
          id,
          fileName,
          type,
        }))}
        initialJobs={(await listVideoJobs(user.id, content.id)).map((job) => ({
          ...job,
          createdAt: displayDate(job.createdAt),
          estimatedCost: job.estimatedCost?.toString() ?? null,
        }))}
      />
      <AudioAssets
        contentId={content.id}
        script={content.script}
        configured={audioConfiguration.configured}
        provider={audioConfiguration.provider}
        model={audioConfiguration.model}
        initialAssets={(await listAudioAssets(user.id, content.id)).map(
          (asset) => ({
            ...asset,
            speed: asset.speed?.toString() ?? null,
          }),
        )}
      />
      <VideoComposer
        contentId={content.id}
        assets={(await listComposerAssets(user.id, content.id)).map(
          ({ id, fileName, type }) => ({ id, fileName, type }),
        )}
        videos={(await listComposedVideos(user.id, content.id)).map(
          ({ id, fileName, type }) => ({ id, fileName, type }),
        )}
      />
    </>
  );
}
