// Test-process preload only; never imported by application code.
if (
  process.env.TEST_MOCK_AI !== "1" ||
  process.env.OPENAI_API_KEY !== "e2e-placeholder-not-a-real-key"
)
  throw new Error("Mock requires explicit test settings and a dummy key.");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  const endpoint = String(url);
  if (endpoint === "https://api.openai.com/v1/images/generations")
    return Response.json({
      data: [{ b64_json: Buffer.from("mock-image-png").toString("base64") }],
    });
  if (endpoint === "https://api.openai.com/v1/images/edits")
    return Response.json({
      data: [
        { b64_json: Buffer.from("mock-edited-image-png").toString("base64") },
      ],
    });
  if (endpoint !== "https://api.openai.com/v1/responses")
    return originalFetch(url, options);
  const { product, options: choices } = JSON.parse(
    JSON.parse(options.body).input,
  );
  if (choices.additionalInstructions === "__mock_failure__")
    return Response.json({ error: "simulated failure" }, { status: 429 });
  const text =
    choices.additionalInstructions === "__mock_invalid__"
      ? {}
      : {
          hook: `MOCK: ${product.name}`,
          script: `MOCK: ${product.description}; ${product.features}; ${choices.contentType}; ${choices.language}; ${choices.tone}; ${choices.targetAudience}`,
          caption: `MOCK Affiliate: ${product.price} ${product.currency}; ${product.platform}; ${product.affiliateUrl}; ${choices.targetPlatform}`,
          cta: "MOCK: ดูรายละเอียดสินค้า",
          hashtags: ["#MockTest", "#Affiliate"],
        };
  return Response.json({
    status: "completed",
    model: "mock-openai-model",
    output: [
      {
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify(text) }],
      },
    ],
  });
};
