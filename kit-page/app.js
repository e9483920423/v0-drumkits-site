let allDownloads = []
let currentDownloadUrl = null;
let currentItemSlug = null;


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

function createSmartImage(imageUrl, altText, width = 800, height = 800) {
  const img = document.createElement("img")
  img.alt = ""
  img.loading = "eager"
  img.decoding = "async"
  img.style.visibility = "hidden"
  if (width) img.width = width
  if (height) img.height = height
  img.onerror = () => {
    img.src = "/errors/default.jpg"
    img.style.visibility = "visible"
  }

  const probe = new Image()
  probe.decoding = "async"
  probe.onload = () => {
    img.src = imageUrl
    img.style.visibility = "visible"
  }
  probe.onerror = () => {
    img.src = "/errors/default.jpg"
    img.style.visibility = "visible"
  }
  probe.src = imageUrl

  return img
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

  currentDownloadUrl = item.download || null;
  currentItemSlug = item.slug || null;

  const imageUrl = getItemImageUrl(item.id)

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
      <a class="btn download-btn" type="button">Download Now</a>
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
    const imageUrl = getItemImageUrl(item.id)
    
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

function updateDownloadButtonText(button, message) {
  button.textContent = message;
  button.disabled = true;
  button.style.opacity = "0.7";
  button.style.cursor = "not-allowed";
}

function resetDownloadButton(button) {
  button.textContent = "Download Now";
  button.disabled = false;
  button.style.opacity = "";
  button.style.cursor = "";
}

function showHilltopCountdownInButton(button) {
  const tick = () => {
    const left = Math.max(0, hilltopReadyAt - Date.now());
    if (left <= 0) {
      resetDownloadButton(button);
      return;
    }
    const sec = Math.ceil(left / 1000);
    updateDownloadButtonText(button, `Please wait ${sec}s...`);
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

document.addEventListener(
  "click",
  (e) => {
    const btn = e.target.closest(".download-btn");
    if (!btn) return;
    if (hilltopFiredThisPage) {
      if (currentDownloadUrl) {
        window.open(currentDownloadUrl, "_blank", "noopener,noreferrer");
      } else {
        console.warn("Download URL not available.");
      }
      return;
    }

    const now = Date.now();
    if (hilltopReadyAt && now < hilltopReadyAt) {
      e.preventDefault();
      showHilltopCountdownInButton(btn);
      return;
    }
    
    e.preventDefault();
    window.open(HILLTOP_DIRECT_URL, "_blank", "noopener,noreferrer");

    hilltopReadyAt = now + HILLTOP_DELAY_MS;
    showHilltopCountdownInButton(btn);

    setTimeout(() => {
      hilltopFiredThisPage = true;
      setTimeout(() => {
        resetDownloadButton(btn);
      }, 1600);
    }, HILLTOP_DELAY_MS);
  },
  true
);

document.addEventListener("DOMContentLoaded", loadDownloads)
