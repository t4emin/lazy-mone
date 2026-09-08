import assert from "node:assert/strict";
import { test } from "node:test";
import { OpenAITextProvider } from "../src/lib/ai/providers/openai";
import { OpenAIImageProvider } from "../src/lib/ai/providers/openai-image";
import { OpenAIAudioProvider } from "../src/lib/ai/providers/openai-audio";
import {
  contentTextSchema,
  defaultGenerationOptions,
  editContentSchema,
} from "../src/lib/content/validation";
import type { GenerateContentInput } from "../src/lib/ai/text-provider";
const input: GenerateContentInput = {
  product: {
    name: "แก้วน้ำ",
    description: "เก็บความเย็น",
    features: "ฝาปิด",
    price: "199.90",
    platform: "SHOPEE",
    affiliateUrl: "https://example.com/?ref=1",
  },
  options: defaultGenerationOptions,
};
const text = {
  hook: "ลองดูแก้วใบนี้",
  script: "แก้วพร้อมฝาปิด",
  caption: "ลิงก์ Affiliate",
  cta: "ดูสินค้า",
  hashtags: ["#แก้วน้ำ"],
};
const envelope = {
  status: "completed",
  model: "actual-model-snapshot",
  output: [
    {
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(text) }],
    },
  ],
};
test("adapter sends product facts and options and records the returned model", async () => {
  const transport: typeof fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(String(options?.body));
    const sent = JSON.parse(body.input);
    assert.deepEqual(sent.product, { ...input.product, currency: "THB" });
    assert.deepEqual(sent.options, input.options);
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    return Response.json(envelope);
  };
  assert.deepEqual(
    await new OpenAITextProvider(
      "unit-test-key",
      "requested-model",
      transport,
    ).generateContent(input),
    { text, model: "actual-model-snapshot", provider: "openai" },
  );
});
test("AI errors and invalid responses fail without inventing content or leaking provider errors", async () => {
  for (const status of [401, 403, 429, 500]) {
    const adapter = new OpenAITextProvider(
      "unit-test-key",
      "model",
      async () => new Response("sensitive error", { status }),
    );
    await assert.rejects(
      () => adapter.generateContent(input),
      (error) =>
        error instanceof Error && !error.message.includes("sensitive error"),
    );
  }
  for (const response of [
    { ...envelope, status: "incomplete" },
    {
      ...envelope,
      output: [{ type: "message", content: [{ type: "refusal" }] }],
    },
    {
      ...envelope,
      output: [
        { type: "message", content: [{ type: "output_text", text: "{}" }] },
      ],
    },
  ]) {
    await assert.rejects(() =>
      new OpenAITextProvider("key", "model", async () =>
        Response.json(response),
      ).generateContent(input),
    );
  }
  await assert.rejects(() =>
    new OpenAITextProvider("key", "model", async () => {
      throw new Error("network");
    }).generateContent(input),
  );
});
test("edits reject forged provenance, blank output and missing concurrency version", () => {
  const valid = { ...text, status: "draft", version: 1 };
  assert.equal(editContentSchema.safeParse(valid).success, true);
  assert.equal(
    editContentSchema.safeParse({ ...valid, aiProvider: "forged" }).success,
    false,
  );
  assert.equal(
    editContentSchema.safeParse({ ...valid, version: undefined }).success,
    false,
  );
  assert.equal(
    contentTextSchema.safeParse({ ...text, hook: " " }).success,
    false,
  );
});
test("image adapter uses generation or edit endpoint, preserves ratio and returns PNG bytes", async () => {
  const calls: { url: string; options?: RequestInit }[] = [];
  const provider = new OpenAIImageProvider(
    "unit-test-key",
    "image-model",
    async (url, options) => {
      calls.push({ url: String(url), options });
      return Response.json({
        data: [{ b64_json: Buffer.from("png-bytes").toString("base64") }],
      });
    },
  );
  const base = {
    prompt: "A product image prompt",
    aspectRatio: "9:16" as const,
  };
  const first = await provider.generateImage({ ...base, references: [] });
  assert.equal(calls[0].url, "https://api.openai.com/v1/images/generations");
  assert.equal(JSON.parse(String(calls[0].options?.body)).size, "1024x1536");
  assert.deepEqual(first, {
    data: Buffer.from("png-bytes"),
    provider: "openai",
    model: "image-model",
  });
  await provider.generateImage({
    ...base,
    references: [
      {
        data: Buffer.from("reference"),
        fileName: "item.png",
        mimeType: "image/png",
      },
    ],
  });
  assert.equal(calls[1].url, "https://api.openai.com/v1/images/edits");
  assert.ok(calls[1].options?.body instanceof FormData);
});
test("audio adapter sends voice, language and speed and returns MP3 bytes", async () => {
  const provider = new OpenAIAudioProvider(
    "unit-test-key",
    "gpt-4o-mini-tts",
    async (url, options) => {
      assert.equal(url, "https://api.openai.com/v1/audio/speech");
      assert.deepEqual(JSON.parse(String(options?.body)), {
        model: "gpt-4o-mini-tts",
        input: "สวัสดีครับ",
        voice: "marin",
        speed: 1.25,
        response_format: "mp3",
        instructions: "Speak naturally in Thai.",
      });
      return new Response(Buffer.from("mp3-bytes"));
    },
  );
  assert.deepEqual(
    await provider.generateAudio({
      text: "สวัสดีครับ",
      voice: "marin",
      language: "Thai",
      speed: 1.25,
    }),
    {
      data: Buffer.from("mp3-bytes"),
      provider: "openai",
      model: "gpt-4o-mini-tts",
    },
  );
});
