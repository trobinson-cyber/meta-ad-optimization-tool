const demoAssets = [
  {
    name: "Product dashboard image",
    type: "Image",
    source: "Google Drive / Brand / Product",
    background:
      "linear-gradient(135deg, #1b6ee8 0%, #35a98f 48%, #f3f8fb 49%, #ffffff 100%)",
  },
  {
    name: "Customer proof snippets",
    type: "Copy",
    source: "Google Drive / Messaging",
    background:
      "linear-gradient(135deg, #f7b955 0%, #ffffff 50%, #20303c 51%, #20303c 100%)",
  },
  {
    name: "Founder portrait set",
    type: "Image",
    source: "Google Drive / People",
    background:
      "radial-gradient(circle at 35% 35%, #f1d2b0 0 20%, transparent 21%), linear-gradient(135deg, #28495c, #c8e2e7)",
  },
  {
    name: "Offer one-liners",
    type: "Copy",
    source: "Google Drive / Offers",
    background:
      "linear-gradient(135deg, #ffffff 0%, #ffffff 45%, #6f4cc3 46%, #0d7f8b 100%)",
  },
];

let assets = [...demoAssets];

const demoAccounts = [
  {
    id: "act-main",
    name: "Main Brand",
    metaId: "act_102948571",
    pixel: "Main purchase pixel",
    audience: "US founders, marketers, ecommerce teams",
    budget: 250,
    objective: "Sales",
    event: "Purchase",
    draftOffset: 8,
  },
  {
    id: "act-retargeting",
    name: "Retargeting Lab",
    metaId: "act_748203615",
    pixel: "Retargeting pixel",
    audience: "Website visitors, cart abandoners, warm leads",
    budget: 120,
    objective: "Leads",
    event: "Lead",
    draftOffset: 5,
  },
  {
    id: "act-testing",
    name: "Creative Test Account",
    metaId: "act_558194026",
    pixel: "Sandbox conversion pixel",
    audience: "Lookalikes, broad interest tests, creators",
    budget: 80,
    objective: "Traffic",
    event: "Subscribe",
    draftOffset: 3,
  },
];

const baseVariants = [
  {
    headline: "Launch better Meta ads before lunch",
    body: "Turn approved brand assets into tested campaigns with AI copy, clear controls, and fast approval.",
    image: "Dashboard screenshot with budget and creative recommendations visible.",
    score: 91,
    cpa: 29,
    ctr: 2.8,
  },
  {
    headline: "Your brand brief, turned into ad sets",
    body: "Pull images and copy from Drive, generate on-brand variants, and send winners to Meta with one click.",
    image: "Side-by-side ad previews using product UI and customer proof.",
    score: 88,
    cpa: 34,
    ctr: 2.2,
  },
  {
    headline: "Find the ads worth scaling",
    body: "Test creative angles, compare performance, and get plain-language optimization moves every day.",
    image: "Performance chart overlaid with creative thumbnails and winning audience labels.",
    score: 84,
    cpa: 37,
    ctr: 1.9,
  },
  {
    headline: "Approve campaigns without the spreadsheet chase",
    body: "Review each ad set, approve winners, reject weak variants, and keep launch decisions in one place.",
    image: "Approval queue showing approve and reject controls beside each variant.",
    score: 79,
    cpa: 42,
    ctr: 1.6,
  },
];

let accounts = [...demoAccounts];
let selectedAccountId = accounts[0].id;
let variantsByAccount = buildInitialVariants(accounts);

function buildInitialVariants(accountList) {
  return Object.fromEntries(
    accountList.map((account, accountIndex) => [
      account.id,
      baseVariants.map((variant, index) => ({
        ...variant,
        id: index + 1,
        accountId: account.id,
        status: "pending",
        score: variant.score - accountIndex * 3,
        cpa: variant.cpa + accountIndex * 5,
      })),
    ]),
  );
}

const assetList = document.querySelector("#assetList");
const variantList = document.querySelector("#variantList");
const approvalList = document.querySelector("#approvalList");
const reviewCount = document.querySelector("#reviewCount");
const draftCount = document.querySelector("#draftCount");
const toast = document.querySelector("#toast");
const accountSelect = document.querySelector("#accountSelect");
const pixelSelect = document.querySelector("#pixel");
const accountSummary = document.querySelector("#accountSummary");
const conversionSelect = document.querySelector("#conversion");
const pageSelect = document.querySelector("#pageSelect");
const destinationUrlInput = document.querySelector("#destinationUrl");
const creativeFields = {
  body: document.querySelector("#creativeBody"),
  headline: document.querySelector("#creativeHeadline"),
  description: document.querySelector("#creativeDescription"),
  imageUrl: document.querySelector("#creativeImageUrl"),
  cta: document.querySelector("#creativeCta"),
  destinationUrl: document.querySelector("#creativeDestinationUrl"),
};
const defaultEvents = ["Purchase", "Lead", "Subscribe", "Schedule"];
let metaPages = [];

function getSelectedAccount() {
  return accounts.find((account) => account.id === selectedAccountId);
}

function getSelectedVariants() {
  if (!variantsByAccount[selectedAccountId]) {
    variantsByAccount[selectedAccountId] = buildInitialVariants([getSelectedAccount()])[
      selectedAccountId
    ];
  }
  return variantsByAccount[selectedAccountId];
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function renderAssets() {
  assetList.innerHTML = assets
    .map(
      (asset) => `
        <article class="asset-card">
          <div class="asset-thumb" style="${asset.thumbnail ? `background-image: url('${asset.thumbnail}')` : `background: ${asset.background}`}"></div>
          <div>
            <strong>${asset.name}</strong>
            <small>${asset.type} - ${asset.source}</small>
          </div>
        </article>
      `,
    )
    .join("");
}

async function connectGoogleDrive() {
  const response = await fetch("/api/google-auth-url");
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    showToast(error.error || "Google Drive connection is not configured yet.");
    return;
  }

  const data = await response.json();
  window.location.href = data.url;
}

async function syncGoogleDriveAssets() {
  const button = document.querySelector("#syncAssets");
  button.disabled = true;
  button.textContent = "Syncing...";

  try {
    const response = await fetch("/api/google-drive-assets");
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Google Drive assets are not connected yet.");
    }

    const data = await response.json();
    const driveAssets = Array.isArray(data.assets) ? data.assets : [];
    if (!driveAssets.length) {
      throw new Error("No image or copy assets were found in Google Drive.");
    }

    assets = driveAssets.map((asset, index) => ({
      ...asset,
      background: demoAssets[index % demoAssets.length].background,
    }));
    renderAssets();
    showToast(`${assets.length} Google Drive assets synced.`);
  } catch (error) {
    assets = [...demoAssets];
    renderAssets();
    showToast(`${error.message} Showing demo assets.`);
  } finally {
    button.disabled = false;
    button.textContent = "Sync";
  }
}

async function connectMeta() {
  try {
    const accountsResponse = await fetch("/api/meta-ad-accounts");
    if (accountsResponse.ok) {
      const data = await accountsResponse.json();
      const metaAccounts = Array.isArray(data.accounts) ? data.accounts : [];

      if (metaAccounts.length) {
        accounts = metaAccounts;
        selectedAccountId = accounts[0].id;
        variantsByAccount = buildInitialVariants(accounts);
        renderAccountControls();
        hydrateAccountFields();
        renderVariants();
        renderApprovals();
        renderRecommendations();
        drawChart();
        showToast(`${accounts.length} Meta ad accounts loaded.`);
        loadMetaPages();
        loadPixelsForSelectedAccount();
        return;
      }
    }

    const authResponse = await fetch("/api/meta-auth-url");
    if (!authResponse.ok) {
      const error = await authResponse.json().catch(() => ({}));
      throw new Error(error.error || "Meta connection is not configured yet.");
    }

    const data = await authResponse.json();
    window.location.href = data.url;
  } catch (error) {
    showToast(`${error.message} Demo accounts are still available.`);
  }
}

async function loadMetaPages() {
  try {
    const response = await fetch("/api/meta-pages");
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Meta Pages could not be loaded.");
    }

    const data = await response.json();
    metaPages = Array.isArray(data.pages) ? data.pages : [];
    renderPageOptions();
    showToast(`${metaPages.length} Facebook Pages loaded.`);
  } catch (error) {
    showToast(error.message);
  }
}

function renderPageOptions() {
  if (!metaPages.length) {
    pageSelect.innerHTML = `<option value="">No Pages loaded</option>`;
    return;
  }

  pageSelect.innerHTML = metaPages
    .map((page) => `<option value="${page.id}">${page.name}</option>`)
    .join("");
}

function getCreativeDesign() {
  return {
    body: creativeFields.body.value,
    headline: creativeFields.headline.value,
    description: creativeFields.description.value,
    imageUrl: creativeFields.imageUrl.value,
    cta: creativeFields.cta.value,
    destinationUrl: creativeFields.destinationUrl.value,
  };
}

function setCreativeFromVariant(variant) {
  const account = getSelectedAccount();
  creativeFields.body.value = variant.body;
  creativeFields.headline.value = variant.headline;
  creativeFields.description.value = variant.image;
  creativeFields.destinationUrl.value = destinationUrlInput.value || creativeFields.destinationUrl.value;
  destinationUrlInput.value = creativeFields.destinationUrl.value;
  document.querySelector("#previewPage").textContent = metaPages[0]?.name || account.name || "Ad Optimization Tool";
  updateAdPreview();
}

function updateAdPreview() {
  const creative = getCreativeDesign();
  const page = metaPages.find((item) => item.id === pageSelect.value);
  const destination = creative.destinationUrl || "https://example.com";
  let host = "example.com";
  try {
    host = new URL(destination).hostname.replace(/^www\./, "");
  } catch {}

  document.querySelector("#previewPage").textContent =
    page?.name || getSelectedAccount().name || "Ad Optimization Tool";
  document.querySelector("#previewBody").textContent = creative.body;
  document.querySelector("#previewHeadline").textContent = creative.headline;
  document.querySelector("#previewDescription").textContent = creative.description;
  document.querySelector("#previewDomain").textContent = host;
  document.querySelector("#previewCta").textContent = creative.cta.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  document.querySelector("#previewImage").style.backgroundImage = `url("${creative.imageUrl}")`;
}

function renderAccountControls() {
  accountSelect.innerHTML = accounts
    .map((account) => `<option value="${account.id}">${account.name} - ${account.metaId}</option>`)
    .join("");
  accountSelect.value = selectedAccountId;

  renderPixelOptions(getSelectedAccount());
  renderEventOptions(getSelectedAccount());
}

function renderPixelOptions(account) {
  const pixels = Array.isArray(account.pixels) && account.pixels.length
    ? account.pixels
    : [{ id: account.pixel, name: account.pixel }];

  pixelSelect.innerHTML = pixels
    .map((pixel) => `<option value="${pixel.name}" data-pixel-id="${pixel.id}">${pixel.name}</option>`)
    .join("");
}

function renderEventOptions(account) {
  const selectedPixel = account.pixels?.find((pixel) => pixel.name === account.pixel);
  const events = selectedPixel?.events || defaultEvents;
  conversionSelect.innerHTML = events.map((eventName) => `<option>${eventName}</option>`).join("");
}

function hydrateAccountFields() {
  const account = getSelectedAccount();
  document.querySelector("#budget").value = account.budget;
  document.querySelector("#audience").value = account.audience;
  document.querySelector("#objective").value = account.objective;
  renderPixelOptions(account);
  renderEventOptions(account);
  conversionSelect.value = account.event;
  pixelSelect.value = account.pixel;

  accountSummary.innerHTML = `
    <div>
      <span>Selected account</span>
      <strong>${account.name}</strong>
    </div>
    <div>
      <span>Meta ID</span>
      <strong>${account.metaId}</strong>
    </div>
    <div>
      <span>Pixel</span>
      <strong>${account.pixel}</strong>
    </div>
    <div>
      <span>Launch guardrail</span>
      <strong>Approval required</strong>
    </div>
  `;
}

async function loadPixelsForSelectedAccount() {
  const account = getSelectedAccount();
  if (!account?.metaId?.startsWith("act_")) return;

  try {
    const response = await fetch(
      `/api/meta-pixels?adAccountId=${encodeURIComponent(account.metaId)}`,
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Meta pixels could not be loaded.");
    }

    const data = await response.json();
    const pixels = Array.isArray(data.pixels) ? data.pixels : [];
    if (!pixels.length) {
      throw new Error("No Meta pixels were found for this ad account.");
    }

    account.pixels = pixels;
    account.pixel = pixels[0].name;
    account.event = pixels[0].events?.[0] || account.event;
    hydrateAccountFields();
    showToast(`${pixels.length} Meta pixels loaded for ${account.name}.`);
  } catch (error) {
    showToast(error.message);
  }
}

function renderVariants() {
  variantList.innerHTML = getSelectedVariants()
    .map(
      (variant) => `
        <article class="variant-card">
          <div>
            <strong>${variant.headline}</strong>
            <p>${variant.body}</p>
            <small>Image suggestion: ${variant.image}</small>
          </div>
          <div class="score">${variant.score}</div>
        </article>
      `,
    )
    .join("");
}

function renderApprovals() {
  const account = getSelectedAccount();
  const variants = getSelectedVariants();
  const pending = variants.filter((variant) => variant.status === "pending").length;
  reviewCount.textContent = `${pending} pending`;
  draftCount.textContent = String(variants.length + account.draftOffset);

  approvalList.innerHTML = variants
    .map(
      (variant) => `
        <article class="approval-card ${variant.status}" data-id="${variant.id}">
          <div>
            <strong>${variant.headline}</strong>
            <p>${variant.body}</p>
            <small>Status: ${variant.status}</small>
            ${
              variant.draft
                ? `<small>Meta draft: Campaign ${variant.draft.campaignId}${
                    variant.draft.adSetId ? ` / Ad Set ${variant.draft.adSetId}` : ""
                  }${variant.draft.adId ? ` / Ad ${variant.draft.adId}` : ""}</small>`
                : ""
            }
            ${variant.draft?.note ? `<small>${variant.draft.note}</small>` : ""}
          </div>
          <div class="approval-actions">
            <button class="approve" type="button" data-action="approved" ${variant.status !== "pending" ? "disabled" : ""}>Approve</button>
            <button class="reject" type="button" data-action="rejected" ${variant.status !== "pending" ? "disabled" : ""}>Reject</button>
            ${
              variant.status === "approved" && !variant.draft
                ? `<button class="draft" type="button" data-action="draft">Create Draft</button>`
                : ""
            }
          </div>
        </article>
      `,
    )
    .join("");
}

function renderRecommendations() {
  const account = getSelectedAccount();
  const variants = getSelectedVariants();
  const bestVariant = [...variants].sort((a, b) => a.cpa - b.cpa)[0];
  const softVariant = [...variants].sort((a, b) => a.score - b.score)[0];
  const recommendations = [
    {
      title: `Shift budget in ${account.name}`,
      detail: `Variant ${bestVariant.id} has the lowest CPA at $${bestVariant.cpa}. Increase spend only after approval for ${account.metaId}.`,
    },
    {
      title: `Refresh Variant ${softVariant.id}`,
      detail: `Its creative score is ${softVariant.score}. Test a sharper headline before launching this ad set.`,
    },
    {
      title: `Confirm ${account.pixel}`,
      detail: `Use ${account.pixel} and the ${account.event} event before sending approved ads live.`,
    },
  ];

  document.querySelector("#recommendations").innerHTML = recommendations
    .map(
      (recommendation) => `
        <article class="recommendation">
          <strong>${recommendation.title}</strong>
          <small>${recommendation.detail}</small>
        </article>
      `,
    )
    .join("");
}

function normalizeGeneratedVariants(generated, account) {
  return generated.slice(0, 4).map((variant, index) => ({
    id: index + 1,
    accountId: selectedAccountId,
    headline: variant.headline || `Generated ad variant ${index + 1}`,
    body: variant.body || `Generated copy prepared for ${account.name}.`,
    image: variant.image || assets[index % assets.length].name.toLowerCase(),
    score: Number(variant.score) || 86 - index * 4,
    status: "pending",
    cpa: Number(variant.cpa) || 30 + index * 4,
    ctr: Number(variant.ctr) || 2.6 - index * 0.25,
  }));
}

function generateDemoVariants(account, objective, audience, guidelines) {
  const angles = [
    "Move from brief to live campaign faster",
    "Keep every ad variant on brand",
    "Scale winners with clearer evidence",
    "Review Meta ad sets in one clean queue",
  ];

  return angles.map((angle, index) => ({
    id: index + 1,
    accountId: selectedAccountId,
    headline: `${angle}`,
    body: `${objective} campaign for ${audience}. ${guidelines.split(".")[0]}. Prepared for ${account.name}.`,
    image: assets[index % assets.length].name.toLowerCase(),
    score: 92 - index * 5,
    status: "pending",
    cpa: 27 + index * 4,
    ctr: 3.1 - index * 0.35,
  }));
}

async function requestGeneratedVariants(account, objective, audience, conversion, guidelines) {
  const response = await fetch("/api/generate-ads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account,
      objective,
      audience,
      conversion,
      guidelines,
      assets,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Generation route unavailable.");
  }

  const data = await response.json();
  return normalizeGeneratedVariants(data.variants || [], account);
}

async function generateVariants() {
  const account = getSelectedAccount();
  const objective = document.querySelector("#objective").value;
  const audience = document.querySelector("#audience").value;
  const conversion = document.querySelector("#conversion").value;
  const guidelines = document.querySelector("#guidelines").value;
  const button = document.querySelector("#generateBtn");

  button.disabled = true;
  button.textContent = "Generating...";

  try {
    variantsByAccount[selectedAccountId] = await requestGeneratedVariants(
      account,
      objective,
      audience,
      conversion,
      guidelines,
    );
    showToast(`GPT-generated variants are ready for ${account.name}.`);
  } catch (error) {
    variantsByAccount[selectedAccountId] = generateDemoVariants(
      account,
      objective,
      audience,
      guidelines,
    );
    showToast(`${error.message} Demo variants were generated instead.`);
  } finally {
    button.disabled = false;
    button.textContent = "Generate variants";
  }

  renderVariants();
  renderApprovals();
  renderRecommendations();
  drawChart();
  setCreativeFromVariant(getSelectedVariants()[0]);
}

async function createMetaDraft(variantId) {
  const account = getSelectedAccount();
  const variant = getSelectedVariants().find((item) => item.id === variantId);
  const page = metaPages.find((item) => item.id === pageSelect.value);
  const creative = getCreativeDesign();
  const destinationUrl = creative.destinationUrl || destinationUrlInput.value;
  if (!variant) return;

  try {
    const response = await fetch("/api/meta-create-draft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account, variant, page, destinationUrl, creative }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error = {};
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      const stage = error.stage ? `${error.stage}: ` : "";
      throw new Error(`${stage}${error.error || "Meta draft creation failed."}`);
    }

    const data = await response.json();
    variantsByAccount[selectedAccountId] = getSelectedVariants().map((item) =>
      item.id === variantId ? { ...item, draft: data.draft } : item,
    );
    renderApprovals();
    showToast("Paused Meta campaign draft created.");
  } catch (error) {
    showToast(`Meta draft failed: ${error.message}`);
  }
}

function handleApproval(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const card = button.closest(".approval-card");
  const id = Number(card.dataset.id);
  const action = button.dataset.action;
  if (action === "draft") {
    createMetaDraft(id);
    return;
  }

  variantsByAccount[selectedAccountId] = getSelectedVariants().map((variant) =>
    variant.id === id ? { ...variant, status: action } : variant,
  );

  renderApprovals();
  renderRecommendations();
  drawChart();
  showToast(action === "approved" ? "Ad set approved for Meta launch." : "Ad set rejected and held back.");
}

function drawChart() {
  const canvas = document.querySelector("#performanceChart");
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 44;
  const variants = getSelectedVariants();
  const maxCpa = Math.max(...variants.map((variant) => variant.cpa), 45);

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#dfe6ea";
  context.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = padding + i * ((height - padding * 2) / 4);
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  const barWidth = (width - padding * 2) / variants.length - 28;
  variants.forEach((variant, index) => {
    const x = padding + index * ((width - padding * 2) / variants.length) + 14;
    const barHeight = ((height - padding * 2) * variant.cpa) / maxCpa;
    const y = height - padding - barHeight;

    context.fillStyle = variant.status === "approved" ? "#16845f" : "#1769e0";
    context.fillRect(x, y, barWidth, barHeight);

    context.fillStyle = "#172027";
    context.font = "700 14px system-ui";
    context.fillText(`V${variant.id}`, x + 4, height - 17);
    context.fillStyle = "#65717c";
    context.font = "12px system-ui";
    context.fillText(`$${variant.cpa} CPA`, x + 4, y - 9);
  });
}

function switchAccount(accountId) {
  selectedAccountId = accountId;
  hydrateAccountFields();
  renderVariants();
  renderApprovals();
  renderRecommendations();
  drawChart();
  showToast(`Switched to ${getSelectedAccount().name}.`);
  loadPixelsForSelectedAccount();
}

function openAdsManager() {
  const account = getSelectedAccount();
  const accountId = account?.accountId || account?.metaId?.replace("act_", "");
  const url = accountId
    ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${encodeURIComponent(accountId)}`
    : "https://adsmanager.facebook.com/adsmanager/manage/campaigns";
  window.open(url, "_blank", "noopener,noreferrer");
}

document.querySelector("#generateBtn").addEventListener("click", generateVariants);
document.querySelector("#connectMeta").addEventListener("click", connectMeta);
document.querySelector("#openAdsManager").addEventListener("click", openAdsManager);
document.querySelector("#connectDrive").addEventListener("click", connectGoogleDrive);
document.querySelector("#syncAssets").addEventListener("click", syncGoogleDriveAssets);
document.querySelector("#useTopVariant").addEventListener("click", () => {
  setCreativeFromVariant(getSelectedVariants()[0]);
  showToast("Top variant loaded into the ad designer.");
});
Object.values(creativeFields).forEach((field) => {
  field.addEventListener("input", () => {
    if (field === creativeFields.destinationUrl) {
      destinationUrlInput.value = field.value;
    }
    updateAdPreview();
  });
  field.addEventListener("change", updateAdPreview);
});
pageSelect.addEventListener("change", updateAdPreview);
document.querySelector("#analyzeBtn").addEventListener("click", () => {
  drawChart();
  renderRecommendations();
  showToast("Performance analysis refreshed with optimization suggestions.");
});
approvalList.addEventListener("click", handleApproval);
accountSelect.addEventListener("change", (event) => switchAccount(event.target.value));
pixelSelect.addEventListener("change", () => {
  const account = getSelectedAccount();
  account.pixel = pixelSelect.value;
  renderEventOptions(account);
  account.event = conversionSelect.value;
  hydrateAccountFields();
});
conversionSelect.addEventListener("change", () => {
  getSelectedAccount().event = conversionSelect.value;
  hydrateAccountFields();
});

renderAccountControls();
hydrateAccountFields();
renderAssets();
renderVariants();
renderApprovals();
renderRecommendations();
drawChart();
setCreativeFromVariant(getSelectedVariants()[0]);
