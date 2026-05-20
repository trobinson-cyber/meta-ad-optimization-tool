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

async function metaPost(path, payload) {
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

  const response = await fetch(`https://graph.facebook.com/v20.0/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      ...cleanPayload,
      access_token: process.env.META_ACCESS_TOKEN,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data.error?.error_user_msg || data.error?.message || "Meta request failed.";
    throw new Error(message);
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for Meta draft creation." });
  }

  if (!process.env.META_ACCESS_TOKEN) {
    return res.status(500).json({
      error: "Missing META_ACCESS_TOKEN in Vercel environment variables.",
    });
  }

  const body = readBody(req);
  const account = body.account || {};
  const variant = body.variant || {};
  const adAccountId = String(account.metaId || "");

  if (!/^act_\d+$/.test(adAccountId)) {
    return res.status(400).json({ error: "A valid selected Meta ad account is required." });
  }

  const budget = Math.max(Number(account.budget) || 50, 5);
  const dailyBudgetCents = String(Math.round(budget * 100));
  const campaignName = `Draft - ${variant.headline || "GPT Variant"} - ${new Date()
    .toISOString()
    .slice(0, 10)}`;

  try {
    const campaign = await metaPost(`${adAccountId}/campaigns`, {
      name: campaignName,
      objective: "OUTCOME_TRAFFIC",
      status: "PAUSED",
      special_ad_categories: "[]",
    });

    const adSetPayload = {
      name: `Draft Ad Set - ${variant.headline || "Variant"}`,
      campaign_id: campaign.id,
      daily_budget: dailyBudgetCents,
      billing_event: "IMPRESSIONS",
      optimization_goal: "LINK_CLICKS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      status: "PAUSED",
      targeting: JSON.stringify({
        geo_locations: {
          countries: ["US"],
        },
      }),
    };

    if (process.env.META_PAGE_ID) {
      adSetPayload.promoted_object = JSON.stringify({
        page_id: process.env.META_PAGE_ID,
      });
    }

    const adSet = await metaPost(`${adAccountId}/adsets`, adSetPayload);

    return res.status(200).json({
      draft: {
        campaignId: campaign.id,
        adSetId: adSet.id,
        status: "PAUSED",
        name: campaignName,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to create Meta draft." });
  }
};
