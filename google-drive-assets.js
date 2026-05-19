async function getAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Unable to refresh Google access token.");
  }

  return data.access_token;
}

function inferAssetType(file) {
  if (file.mimeType?.startsWith("image/")) return "Image";
  if (file.mimeType?.includes("document") || file.mimeType === "text/plain") return "Copy";
  return "Asset";
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET for Drive assets." });
  }

  const required = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
  ].filter((key) => !process.env[key]);

  if (required.length) {
    return res.status(500).json({
      error: `Missing ${required.join(", ")} in Vercel environment variables.`,
    });
  }

  try {
    const accessToken = await getAccessToken();
    const query = [
      "trashed = false",
      "(mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain')",
    ].join(" and ");
    const params = new URLSearchParams({
      q: query,
      pageSize: "20",
      fields: "files(id,name,mimeType,webViewLink,thumbnailLink,modifiedTime)",
      orderBy: "modifiedTime desc",
    });

    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const driveData = await driveResponse.json();
    if (!driveResponse.ok) {
      return res.status(driveResponse.status).json({
        error: driveData.error?.message || "Google Drive request failed.",
      });
    }

    return res.status(200).json({
      assets: (driveData.files || []).map((file) => ({
        id: file.id,
        name: file.name,
        type: inferAssetType(file),
        source: "Google Drive",
        url: file.webViewLink,
        thumbnail: file.thumbnailLink,
        modifiedTime: file.modifiedTime,
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to load Drive assets." });
  }
};
