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

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for ad generation." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured in Vercel." });
  }

  const body = readBody(req);
  const account = body.account || {};
  const assets = Array.isArray(body.assets) ? body.assets : [];
  const guidelines = String(body.guidelines || "").slice(0, 1600);
  const objective = String(body.objective || "Sales").slice(0, 80);
  const audience = String(body.audience || "").slice(0, 400);
  const conversion = String(body.conversion || "").slice(0, 80);

  const prompt = {
    task: "Generate four Meta ad variants for review before launch.",
    account: {
      name: account.name,
      metaId: account.metaId,
      pixel: account.pixel,
    },
    campaign: {
      objective,
      audience,
      conversion,
      guidelines,
    },
    availableAssets: assets.map((asset) => ({
      name: asset.name,
      type: asset.type,
      source: asset.source,
    })),
    outputRules: [
      "Return only JSON.",
      "Use this shape: { \"variants\": [{ \"headline\": string, \"body\": string, \"image\": string, \"score\": number, \"cpa\": number, \"ctr\": number }] }.",
      "Headlines should be 8 words or fewer.",
      "Body text should be 28 words or fewer.",
      "Score should be 70 to 96.",
      "CPA should be a realistic estimated number.",
      "CTR should be a realistic estimated percentage number.",
    ],
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        input: JSON.stringify(prompt),
        instructions:
          "You are a senior paid social strategist. Generate compliant, on-brand Meta ad copy and practical image suggestions. Return only valid JSON.",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed.",
      });
    }

    const text =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .filter((item) => item.type === "output_text")
        .map((item) => item.text)
        .join("");

    const parsed = parseJsonText(text || "");
    const variants = Array.isArray(parsed?.variants) ? parsed.variants.slice(0, 4) : [];

    if (!variants.length) {
      return res.status(502).json({ error: "OpenAI returned an unexpected format." });
    }

    return res.status(200).json({ variants });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Ad generation failed." });
  }
};
