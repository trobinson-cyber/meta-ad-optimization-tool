function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async function handler(req, res) {
  const code = req.query?.code;
  const error = req.query?.error;

  if (error) {
    return res.status(400).send(`Google authorization failed: ${escapeHtml(error)}`);
  }

  if (!code) {
    return res.status(400).send("Missing Google authorization code.");
  }

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
    return res.status(500).send("Google OAuth environment variables are missing in Vercel.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    return res.status(tokenResponse.status).send(
      `Google token exchange failed: ${escapeHtml(tokenData.error_description || tokenData.error || "Unknown error")}`,
    );
  }

  const refreshToken = tokenData.refresh_token;
  if (!refreshToken) {
    return res.status(200).send(`
      <main style="font-family: system-ui, sans-serif; max-width: 720px; margin: 48px auto; line-height: 1.5;">
        <h1>Google Drive connected, but no refresh token was returned.</h1>
        <p>Remove this app from your Google account permissions, then connect again. The app requests offline access so Vercel can refresh Drive access securely.</p>
      </main>
    `);
  }

  return res.status(200).send(`
    <main style="font-family: system-ui, sans-serif; max-width: 760px; margin: 48px auto; line-height: 1.5;">
      <h1>Google Drive connected</h1>
      <p>Add this value to Vercel as an environment variable named <strong>GOOGLE_REFRESH_TOKEN</strong>, then redeploy.</p>
      <textarea readonly style="width: 100%; min-height: 120px; padding: 12px; border: 1px solid #ccd6dd; border-radius: 8px;">${escapeHtml(refreshToken)}</textarea>
      <p>After redeploying, return to the dashboard and click <strong>Sync</strong> in the Google Drive asset panel.</p>
    </main>
  `);
};
