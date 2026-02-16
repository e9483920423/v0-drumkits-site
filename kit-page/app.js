let allDownloads = []

function getItemImageUrl(id) {
  const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
  return `${PUB_URL}/${id}.jpg`
}

async function loadDownloads() {
  try {
    const { data, error } = await supabaseClient
      .from('drum_kits')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    allDownloads = data || []
    displayItem()
  } catch (error) {
    console.error("Error loading downloads:", error)
    showError("Failed to load item data. Please try again.")
  }
}

function getSlugFromUrl() {
  let slug = window.location.pathname.split("/").filter(Boolean).pop()
  if (slug) {
    try {
      slug = decodeURIComponent(slug)
    } catch (e) {
      console.warn("Could not decode slug, using original:", slug)
    }
  }

  return slug
}

function displayItem() {
  let slug = getSlugFromUrl()
  if (!slug) {
    const params = new URLSearchParams(window.location.search)
    slug = params.get("slug")
  }

  if (!slug) {
    showError("No item specified. Please return to the home page.")
    return
  }

  const newUrl = `${window.location.origin}/${slug}`
  window.history.replaceState({}, "", newUrl)

  const item = allDownloads.find((d) => d.slug === slug)

  if (!item) {
    showError(`Item "${slug}" not found. Please return to the home page.`)
    return
  }

  const imageUrl = getItemImageUrl(item.id)

  const mainContent = document.getElementById("mainContent")
  mainContent.innerHTML = `
    <div class="item-hero">
      <div class="item-image-wrapper">
        <img src="${imageUrl}" alt="${escapeHtml(item.title)}" onerror="this.src='/errors/default.jpg'">
      </div>
      <div class="item-details">
        <h1 class="item-title">${escapeHtml(item.title)}</h1>
        <p class="item-description">${escapeHtml(item.description)}</p>
        <div class="item-specs">
          <div class="spec-row">
            <span class="spec-label">File Size:</span>
            <span class="spec-value">${escapeHtml(item.file_size ?? 'N/A')}</span>
          </div>
          ${item.update_date ? `
          <div class="spec-row">
            <span class="spec-label">Last Updated:</span>
            <span class="spec-value">${escapeHtml(item.update_date)}</span>
          </div>
          ` : ''}
        </div>
        <div class="action-buttons">
          <a href="${escapeHtml(item.download)}" class="btn download-btn" target="_blank">Download Now</a>
          <a href="/" class="btn back-btn">← Back to Collection</a>
        </div>
      </div>
    </div>
  `

  renderRandomItems(item.slug)
}

function getRandomItems(excludeSlug, count = 4) {
  const pool = allDownloads.filter((d) => d && d.slug && d.slug !== excludeSlug)

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = pool[i]
    pool[i] = pool[j]
    pool[j] = temp
  }

  return pool.slice(0, count)
}

function renderRandomItems(currentSlug) {
  const section = document.getElementById("randomItemsSection")
  if (!section) return

  const randomItems = getRandomItems(currentSlug, 4)

  if (randomItems.length === 0) {
    section.innerHTML = ""
    return
  }

  const cardsHtml = randomItems
    .map((item) => {
      const imageUrl = getItemImageUrl(item.id)
      return `
        <article class="random-item-card">
          <a href="/${escapeHtml(item.slug)}" class="random-item-image-wrap" aria-label="View ${escapeHtml(item.title)}">
            <img src="${imageUrl}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" onerror="this.src='/errors/default.jpg'">
          </a>
          <h3 class="random-item-title">${escapeHtml(item.title)}</h3>
          <a href="/${escapeHtml(item.slug)}" class="random-item-link">View Details</a>
        </article>
      `
    })
    .join("")

  section.innerHTML = `
    <div class="random-items-inner">
      <div class="random-items-grid">
        ${cardsHtml}
      </div>
    </div>
  `
}

function showError(message) {
  const mainContent = document.getElementById("mainContent")
  mainContent.innerHTML = `
    <div class="error-message">
      <p>${escapeHtml(message)}</p>
      <p style="margin-top: 1rem;"><a href="/">← Return to home</a></p>
    </div>
  `

  const randomSection = document.getElementById("randomItemsSection")
  if (randomSection) randomSection.innerHTML = ""
}

function escapeHtml(text) {
  if (text == null) return ''
  if (typeof text !== 'string') {
    text = String(text)
  }
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

const HILLTOP_DIRECT_URL =
  "https://amazing-population.com/b.3FVX0YP/3Hp/v/b/m/V/J/ZsDP0/2sNnzbYQylNvzjMa5oLUTlYr3GNPjhIw3-NsDaAN";

let hilltopFiredThisPage = false;
let hilltopReadyAt = 0;
const HILLTOP_DELAY_MS = 5000;

function setDownloadBtnCountdown(btn) {
  if (!btn.dataset.hilltopOriginalText) {
    btn.dataset.hilltopOriginalText = btn.textContent || "Download Now";
  }

  btn.setAttribute("aria-disabled", "true");
  btn.style.pointerEvents = "none";
  btn.style.opacity = "0.75";
  btn.style.cursor = "not-allowed";

  const timer = setInterval(() => {
    const left = hilltopReadyAt - Date.now();
    if (left <= 0) {
      clearInterval(timer);
      btn.textContent = btn.dataset.hilltopOriginalText || "Download Now";
      btn.removeAttribute("aria-disabled");
      btn.style.pointerEvents = "";
      btn.style.opacity = "";
      btn.style.cursor = "";
      hilltopFiredThisPage = true;
      return;
    }
    const sec = Math.ceil(left / 1000);
    btn.textContent = `Wait ${sec}s…`;
  }, 200);
}

document.addEventListener(
  "click",
  (e) => {
    const btn = e.target.closest("a.download-btn");
    if (!btn) return;
    if (hilltopFiredThisPage) return;

    const now = Date.now();
    if (hilltopReadyAt && now < hilltopReadyAt) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    window.open(HILLTOP_DIRECT_URL, "_blank", "noopener,noreferrer");

    hilltopReadyAt = now + HILLTOP_DELAY_MS;
    setDownloadBtnCountdown(btn);
  },
  true
);

document.addEventListener("DOMContentLoaded", loadDownloads)
