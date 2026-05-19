const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

module.exports = async function handler(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
    return res.status(500).json({
      error: "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in Vercel.",
    });
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent",
  });

  return res.status(200).json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  });
};
