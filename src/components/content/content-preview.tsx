import Link from "next/link";
import Image from "next/image";

type Asset = { id: string; fileName: string; type: string };

export function ContentPreview({
  product,
  content,
  assets,
}: {
  product: { id: string; name: string; affiliateUrl: string | null };
  content: {
    status: string;
    hook: string;
    script: string;
    caption: string;
    cta: string;
    hashtags: string[];
  };
  assets: Asset[];
}) {
  const images = assets.filter((asset) => asset.type === "generated_image");
  const videos = assets.filter((asset) => asset.type === "video");
  const audio = assets.filter((asset) => asset.type === "audio");
  return (
    <section className="panel content-preview">
      <div className="preview-heading">
        <div>
          <h2>Content Preview</h2>
          <p className="muted">ดูเนื้อหาและ Asset ก่อนนำไปเผยแพร่</p>
        </div>
        <span className={`preview-status preview-status-${content.status}`}>
          {content.status}
        </span>
      </div>
      <p>
        Product: <Link href={`/products/${product.id}`}>{product.name}</Link>
      </p>
      {videos[0] && (
        <div className="preview-video">
          <video
            controls
            preload="metadata"
            src={`/api/assets/${videos[0].id}`}
          >
            Your browser cannot preview this video.
          </video>
        </div>
      )}
      {audio[0] && (
        <audio
          className="preview-audio"
          controls
          preload="metadata"
          src={`/api/assets/${audio[0].id}`}
        >
          Your browser cannot play this audio.
        </audio>
      )}
      {images.length > 0 && (
        <div className="preview-image-grid">
          {images.map((image) => (
            <Image
              key={image.id}
              src={`/api/assets/${image.id}`}
              alt={image.fileName}
              width={130}
              height={130}
              unoptimized
            />
          ))}
        </div>
      )}
      <div className="preview-copy">
        <h3>{content.hook}</h3>
        <p>{content.script}</p>
        <p>{content.caption}</p>
        <p>
          <strong>{content.cta}</strong>
        </p>
        <p>{content.hashtags.join(" ")}</p>
        {product.affiliateUrl && (
          <a href={product.affiliateUrl} target="_blank" rel="noreferrer">
            Open Affiliate URL
          </a>
        )}
      </div>
    </section>
  );
}
