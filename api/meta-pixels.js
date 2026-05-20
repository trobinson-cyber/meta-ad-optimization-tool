module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET for Meta pixels." });
  }

  if (!process.env.META_ACCESS_TOKEN) {
    return res.status(500).json({
      error: "Missing META_ACCESS_TOKEN in Vercel environment variables.",
    });
  }

  const adAccountId = String(req.query?.adAccountId || "");
  if (!/^act_\d+$/.test(adAccountId)) {
    return res.status(400).json({ error: "A valid Meta ad account ID is required." });
  }

  const params = new URLSearchParams({
    fields: "id,name,code",
    limit: "50",
    access_token: process.env.META_ACCESS_TOKEN,
  });

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${adAccountId}/adspixels?${params.toString()}`,
  );
  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({
      error: data.error?.message || "Meta pixel request failed.",
    });
  }

  return res.status(200).json({
    pixels: (data.data || []).map((pixel) => ({
      id: pixel.id,
      name: pixel.name || `Pixel ${pixel.id}`,
      code: pixel.code || pixel.id,
      events: ["Purchase", "Lead", "Subscribe", "Schedule", "ViewContent", "AddToCart"],
    })),
  });
};
