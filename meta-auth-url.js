const META_SCOPES = ["ads_read", "ads_management", "business_management"];

module.exports = async function handler(req, res) {
  if (!process.env.META_APP_ID || !process.env.META_REDIRECT_URI) {
    return res.status(500).json({
      error: "Meta OAuth is not configured. Add META_APP_ID and META_REDIRECT_URI in Vercel.",
    });
  }

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: process.env.META_REDIRECT_URI,
    response_type: "code",
    scope: META_SCOPES.join(","),
  });

  return res.status(200).json({
    url: `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`,
  });
};
