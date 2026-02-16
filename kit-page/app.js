let allDownloads = []
let activeSlug = ""

async function loadDownloads() {
  const { getCachedKitsSync, getAllKits } = window.DrumkitDataStore

  const cached = getCachedKitsSync({ allowStale: true })
  if (cached && cached.length > 0) {
    allDownloads = cached
    displayItem()
  }

  try {
    const latest = await getAllKits({ allowStale: true, revalidate: true })
    if (!cached || latest !== cached) {
      allDownloads = latest
      displayItem()
    }
  } catch (error) {
    console.error("Error loading downloads:", error)
    if (!cached || cached.length === 0) {
      showError("Failed to load item data. Please try again.")
    }
  }
}

function createSmartImage(imageUrl, altText, width = 800, height = 800) {
  const { createKitImage } = window.DrumkitAssets
  return createKitImage(imageUrl, altText, {
    loading: "eager",
    width,
    height,
  })
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
  const { getKitImageUrl } = window.DrumkitAssets
  const { escapeHtml } = window.DrumkitUtils

  let slug = getSlugFromUrl()
  if (!slug) {
    const params = new URLSearchParams(window.location.search)
    slug = params.get("slug")
  }

  activeSlug = slug

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

  const imageUrl = getKitImageUrl(item.id)

  const mainContent = document.getElementById("mainContent")
  
  const heroDiv = document.createElement("div")
  heroDiv.className = "item-hero"
  
  const imageWrapper = document.createElement("div")
  imageWrapper.className = "item-image-wrapper"
  
  const heroImage = createSmartImage(imageUrl, item.title, 800, 800)
  imageWrapper.appendChild(heroImage)
  
  const detailsDiv = document.createElement("div")
  detailsDiv.className = "item-details"
  detailsDiv.innerHTML = `
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
  `
  
  heroDiv.appendChild(imageWrapper)
  heroDiv.appendChild(detailsDiv)
  mainContent.replaceChildren(heroDiv)

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
  const { getKitImageUrl } = window.DrumkitAssets
  const { escapeHtml } = window.DrumkitUtils

  const section = document.getElementById("randomItemsSection")
  if (!section) return

  const randomItems = getRandomItems(currentSlug, 4)

  if (randomItems.length === 0) {
    section.innerHTML = ""
    return
  }

  const grid = document.createElement("div")
  grid.className = "random-items-grid"
  
  randomItems.forEach((item) => {
    const imageUrl = getKitImageUrl(item.id)
    
    const card = document.createElement("article")
    card.className = "random-item-card"
    
    const imageLink = document.createElement("a")
    imageLink.href = `/${escapeHtml(item.slug)}`
    imageLink.className = "random-item-image-wrap"
    imageLink.setAttribute("aria-label", `View ${escapeHtml(item.title)}`)
    
    const img = createSmartImage(imageUrl, item.title, 320, 320)
    imageLink.appendChild(img)
    
    const title = document.createElement("h3")
    title.className = "random-item-title"
    title.textContent = item.title
    
    const detailsLink = document.createElement("a")
    detailsLink.href = `/${escapeHtml(item.slug)}`
    detailsLink.className = "random-item-link"
    detailsLink.textContent = "View Details"
    
    card.appendChild(imageLink)
    card.appendChild(title)
    card.appendChild(detailsLink)
    grid.appendChild(card)
  })
  
  const inner = document.createElement("div")
  inner.className = "random-items-inner"
  inner.appendChild(grid)
  
  section.replaceChildren(inner)
}

function showError(message) {
  const { escapeHtml } = window.DrumkitUtils

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

const HILLTOP_DIRECT_URL =
  "https://amazing-population.com/b.3FVX0YP/3Hp/v/b/m/V/J/ZsDP0/2sNnzbYQylNvzjMa5oLUTlYr3GNPjhIw3-NsDaAN";

let hilltopFiredThisPage = false;
let hilltopReadyAt = 0;
const HILLTOP_DELAY_MS = 5000;

function ensureHilltopToast() {
  let el = document.getElementById("hilltop-toast");
  if (el) return el;

  el = document.createElement("div");
  el.id = "hilltop-toast";
  el.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:18px",
    "transform:translateX(-50%)",
    "background:rgba(0,0,0,0.88)",
    "color:#fff",
    "padding:10px 14px",
    "border:1px solid rgba(255,255,255,0.14)",
    "border-radius:10px",
    "font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
    "z-index:999999",
    "max-width:92vw",
    "text-align:center",
    "box-shadow:0 10px 30px rgba(0,0,0,0.35)"
  ].join(";");
  document.body.appendChild(el);
  return el;
}

function showHilltopCountdownToast() {
  const el = ensureHilltopToast();

  const tick = () => {
    const left = Math.max(0, hilltopReadyAt - Date.now());
    if (left <= 0) {
      el.textContent = "Ready — tap Download again.";
      setTimeout(() => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, 1600);
      return;
    }
    const sec = Math.ceil(left / 1000);
    el.textContent = `Please wait ${sec}s, then tap Download again.`;
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
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
      showHilltopCountdownToast();
      return;
    }
    e.preventDefault();
    window.open(HILLTOP_DIRECT_URL, "_blank", "noopener,noreferrer");

    hilltopReadyAt = now + HILLTOP_DELAY_MS;
    showHilltopCountdownToast();

    setTimeout(() => {
      hilltopFiredThisPage = true;
    }, HILLTOP_DELAY_MS);
  },
  true
);

document.addEventListener("DOMContentLoaded", loadDownloads)

window.addEventListener("drumkits:data-updated", (event) => {
  const latest = event?.detail?.data
  if (!Array.isArray(latest) || latest.length === 0) return

  allDownloads = latest
  if (!activeSlug) {
    displayItem()
    return
  }

  const exists = allDownloads.some((d) => d?.slug === activeSlug)
  if (exists) displayItem()
})
