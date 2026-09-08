import "server-only";
import { ProductError } from "@/lib/products/errors";
import { OpenAITextProvider } from "./providers/openai";
import type { AITextProvider } from "./text-provider";
import { OpenAIImageProvider } from "./providers/openai-image";
import type { AIImageProvider } from "./image-provider";
import { RunwayVideoProvider } from "@/lib/video/providers/runway";
import type { AIVideoProvider } from "@/lib/video/provider";
import { OpenAIAudioProvider } from "./providers/openai-audio";
import type { AIAudioProvider } from "./audio-provider";

export function getAIConfiguration() {
  const provider = process.env.AI_TEXT_PROVIDER?.trim() || "openai";
  const model = process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-5.4-mini";
  return {
    provider,
    model,
    configured:
      provider === "openai" && Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}
export function getImageAIConfiguration() {
  const provider = process.env.AI_IMAGE_PROVIDER?.trim() || "openai";
  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";
  return {
    provider,
    model,
    configured:
      provider === "openai" && Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}
export function getImageProvider(): AIImageProvider {
  const config = getImageAIConfiguration();
  if (config.provider !== "openai")
    throw new ProductError(503, "ยังไม่รองรับ AI Provider ที่ตั้งไว้");
  if (!config.configured)
    throw new ProductError(
      503,
      "ยังไม่ได้ตั้ง OPENAI_API_KEY ในไฟล์ .env ของ Server",
    );
  return new OpenAIImageProvider(
    process.env.OPENAI_API_KEY!.trim(),
    config.model,
  );
}
export function getVideoAIConfiguration() {
  const provider = process.env.AI_VIDEO_PROVIDER?.trim() || "runway";
  const model = process.env.RUNWAY_VIDEO_MODEL?.trim() || "gen4.5";
  return {
    provider,
    model,
    configured:
      provider === "runway" && Boolean(process.env.RUNWAYML_API_SECRET?.trim()),
  };
}
export function getVideoProvider(): AIVideoProvider {
  const config = getVideoAIConfiguration();
  if (config.provider !== "runway")
    throw new ProductError(503, "ยังไม่รองรับ AI Video Provider ที่ตั้งไว้");
  if (!config.configured)
    throw new ProductError(
      503,
      "ยังไม่ได้ตั้ง RUNWAYML_API_SECRET ในไฟล์ .env ของ Server",
    );
  return new RunwayVideoProvider(
    process.env.RUNWAYML_API_SECRET!.trim(),
    config.model,
  );
}
export function getAudioAIConfiguration() {
  const provider = process.env.AI_AUDIO_PROVIDER?.trim() || "openai";
  const model = process.env.OPENAI_AUDIO_MODEL?.trim() || "gpt-4o-mini-tts";
  return {
    provider,
    model,
    configured:
      provider === "openai" && Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}
export function getAudioProvider(): AIAudioProvider {
  const config = getAudioAIConfiguration();
  if (config.provider !== "openai")
    throw new ProductError(503, "ยังไม่รองรับ AI Voice Provider ที่ตั้งไว้");
  if (!config.configured)
    throw new ProductError(
      503,
      "ยังไม่ได้ตั้ง OPENAI_API_KEY ในไฟล์ .env ของ Server",
    );
  return new OpenAIAudioProvider(
    process.env.OPENAI_API_KEY!.trim(),
    config.model,
  );
}
export function getTextProvider(): AITextProvider {
  const config = getAIConfiguration();
  if (config.provider !== "openai")
    throw new ProductError(503, "ยังไม่รองรับ AI Provider ที่ตั้งไว้");
  if (!config.configured)
    throw new ProductError(
      503,
      "ยังไม่ได้ตั้ง OPENAI_API_KEY ในไฟล์ .env ของ Server",
    );
  return new OpenAITextProvider(
    process.env.OPENAI_API_KEY!.trim(),
    config.model,
  );
}
