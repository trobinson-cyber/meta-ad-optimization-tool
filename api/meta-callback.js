function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async function handler(req, res) {
  const code = req.query?.code;
  const error = req.query?.error || req.query?.error_message;

  if (error) {
    return res.status(400).send(`Meta authorization failed: ${escapeHtml(error)}`);
  }

  if (!code) {
    return res.status(400).send("Missing Meta authorization code.");
  }

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET || !process.env.META_REDIRECT_URI) {
    return res.status(500).send("Meta OAuth environment variables are missing in Vercel.");
  }

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    redirect_uri: process.env.META_REDIRECT_URI,
    code,
  });

  const response = await fetch(
    `https://graph.facebook.com/v20.0/oauth/access_token?${params.toString()}`,
  );
  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).send(
      `Meta token exchange failed: ${escapeHtml(data.error?.message || "Unknown error")}`,
    );
  }

  return res.status(200).send(`
    <main style="font-family: system-ui, sans-serif; max-width: 760px; margin: 48px auto; line-height: 1.5;">
      <h1>Meta connected</h1>
      <p>Add this value to Vercel as an environment variable named <strong>META_ACCESS_TOKEN</strong>, then redeploy.</p>
      <textarea readonly style="width: 100%; min-height: 160px; padding: 12px; border: 1px solid #ccd6dd; border-radius: 8px;">${escapeHtml(data.access_token)}</textarea>
      <p>After redeploying, return to the dashboard and click <strong>Connect Meta</strong> to load your ad accounts.</p>
    </main>
  `);
};
