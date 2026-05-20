function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for image generation." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured in Vercel." });
  }

  const body = readBody(req);
  const headline = String(body.headline || "").slice(0, 160);
  const primaryText = String(body.body || "").slice(0, 500);
  const description = String(body.description || "").slice(0, 300);
  const guidelines = String(body.guidelines || "").slice(0, 1200);

  const prompt = [
    "Create a polished paid-social ad image for Meta placements.",
    "Avoid text-heavy layouts and do not include logos unless provided.",
    "Use a clean, modern business aesthetic with clear visual focus.",
    `Headline context: ${headline}`,
    `Primary text context: ${primaryText}`,
    `Creative direction: ${description}`,
    `Brand guidelines: ${guidelines}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini",
        prompt,
        size: "1024x1024",
        quality: "medium",
        n: 1,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI image request failed.",
      });
    }

    const image = data.data?.[0];
    const base64 = image?.b64_json;
    const url = image?.url;
    if (!base64 && !url) {
      return res.status(502).json({ error: "OpenAI returned no image." });
    }

    return res.status(200).json({
      image: {
        name: `Generated image - ${headline || "ad creative"}`,
        type: "Generated",
        source: "OpenAI",
        url: url || `data:image/png;base64,${base64}`,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Image generation failed." });
  }
};
