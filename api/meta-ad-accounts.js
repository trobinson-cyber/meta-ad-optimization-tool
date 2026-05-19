function normalizeStatus(status) {
  const statuses = {
    1: "Active",
    2: "Disabled",
    3: "Unsettled",
    7: "Pending review",
    8: "Pending settlement",
    9: "In grace period",
    100: "Pending closure",
    101: "Closed",
    201: "Any active",
    202: "Any closed",
  };
  return statuses[status] || `Status ${status}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET for Meta ad accounts." });
  }

  if (!process.env.META_ACCESS_TOKEN) {
    return res.status(500).json({
      error: "Missing META_ACCESS_TOKEN in Vercel environment variables.",
    });
  }

  const params = new URLSearchParams({
    fields: "id,name,account_id,currency,timezone_name,account_status",
    limit: "50",
    access_token: process.env.META_ACCESS_TOKEN,
  });

  const response = await fetch(
    `https://graph.facebook.com/v20.0/me/adaccounts?${params.toString()}`,
  );
  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({
      error: data.error?.message || "Meta ad account request failed.",
    });
  }

  return res.status(200).json({
    accounts: (data.data || []).map((account) => ({
      id: account.id,
      name: account.name || `Ad account ${account.account_id}`,
      metaId: account.id,
      accountId: account.account_id,
      currency: account.currency || "USD",
      timezone: account.timezone_name || "Unknown",
      status: normalizeStatus(account.account_status),
      pixel: "Select pixel before launch",
      audience: "Loaded from Meta Ads Manager",
      budget: 100,
      objective: "Sales",
      event: "Purchase",
      draftOffset: 0,
    })),
  });
};
