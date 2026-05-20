module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET for Meta Pages." });
  }

  if (!process.env.META_ACCESS_TOKEN) {
    return res.status(500).json({
      error: "Missing META_ACCESS_TOKEN in Vercel environment variables.",
    });
  }

  const params = new URLSearchParams({
    fields: "id,name,access_token",
    limit: "100",
    access_token: process.env.META_ACCESS_TOKEN,
  });

  const response = await fetch(`https://graph.facebook.com/v20.0/me/accounts?${params}`);
  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({
      error: data.error?.message || "Meta Page request failed.",
    });
  }

  return res.status(200).json({
    pages: (data.data || []).map((page) => ({
      id: page.id,
      name: page.name || `Page ${page.id}`,
      accessToken: page.access_token,
    })),
  });
};
