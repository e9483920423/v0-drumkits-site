let allDownloads = []
let currentDownloadUrl = null;
let currentItemSlug = null;

const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
const IMAGE_EXTENSIONS = ["jpg", "png", "webp", "avif", "jpeg", "gif"]
const imageUrlCache = new Map()

function resolveItemImageUrl(id) {
  const key = String(id)
  const cached = imageUrlCache.get(key)
  if (cached) return Promise.resolve(cached)

  const promises = IMAGE_EXTENSIONS.map(ext => {
    return new Promise((resolve, reject) => {
      const url = `${PUB_URL}/${key}.${ext}`
      const probe = new Image()
      probe.onload = () => resolve(url)
      probe.onerror = reject
      probe.src = url
    })
  })

  return Promise.any(promises)
    .then(validUrl => {
      imageUrlCache.set(key, validUrl)
      return validUrl
    })
    .catch(() => {
      const fallback = "/errors/default.jpg"
      imageUrlCache.set(key, fallback)
      return fallback
    })
}

async function loadDownloads() {
  try {
    const response = await fetch('/api/kits');
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const { data } = await response.json();

    allDownloads = data || []
    if (allDownloads.length > 0) {
      displayItem()
    } else {
      showError("No items available. Please try again later.")
    }
  } catch (error) {
    console.error("Error loading downloads:", error)
    showError("Failed to load item data. Please try again.")
  }
}

function createSmartItemImage(id, width = 800, height = 800) {
  const img = document.createElement("img")
  img.alt = ""
  img.loading = "eager"
  img.decoding = "async"
  img.width = width
  img.height = height
  img.src = "/errors/default.jpg"
  resolveItemImageUrl(id).then((url) => { img.src = url })
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

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function(url) {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
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

  const newUrl = `${window.location.origin}/${encodeURIComponent(slug)}`
  window.history.replaceState({}, "", newUrl)

  const item = allDownloads.find((d) => d.slug === slug)

  if (!item) {
     window.location.href = window.location.origin
     return
  }
  
  document.title = `${escapeHtml(item.title)} | drumkits4.me`

  const { download, ...safeItem } = item
  currentDownloadUrl = download || null
  currentItemSlug = safeItem.slug || null

  const mainContent = document.getElementById("mainContent")
  
  const heroDiv = document.createElement("div")
  heroDiv.className = "item-hero"
  
  const imageWrapper = document.createElement("div")
  imageWrapper.className = "item-image-wrapper"

  const heroImage = createSmartItemImage(item.id, 800, 800)
  imageWrapper.appendChild(heroImage)
  
  const detailsDiv = document.createElement("div")
  detailsDiv.className = "item-details"

  const embedUrl = getYouTubeEmbedUrl(safeItem.src);
  const videoHtml = embedUrl ? `
    <div class="spec-row block-row">
      <div class="video-preview">
        <iframe 
          src="${embedUrl}" 
          title="YouTube video player" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    </div>
  ` : '';
  
  detailsDiv.innerHTML = `
    <h1 class="item-title">${escapeHtml(safeItem.title)}</h1>
    
    <div class="item-specs">
      <div class="spec-row block-row">
        <p class="item-description">${linkify(escapeHtml(safeItem.description))}</p>
      </div>

      ${videoHtml}

      <div class="spec-row">
        <span class="spec-label">File Size:</span>
        <span class="spec-value">${escapeHtml(safeItem.file_size ?? 'N/A')}</span>
      </div>
      ${safeItem.update_date ? `
      <div class="spec-row">
        <span class="spec-label">Last Updated:</span>
        <span class="spec-value">${escapeHtml(safeItem.update_date)}</span>
      </div>
      ` : ''}
    </div>
    <div class="action-buttons">
      <a class="btn download-btn" role="button" tabindex="0">Download Now</a>
      <a href="/" class="btn back-btn">← Back to Collection</a>
    </div>
  `
  
  heroDiv.appendChild(imageWrapper)
  heroDiv.appendChild(detailsDiv)
  mainContent.replaceChildren(heroDiv)
  
  const dlBtn = detailsDiv.querySelector('.download-btn');
  if (dlBtn) {
    const glow = document.createElement('div');
    glow.className = 'mouse-glow';
    dlBtn.appendChild(glow);

    dlBtn.addEventListener('mousemove', e => {
      const rect = dlBtn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      dlBtn.style.setProperty('--mouse-x', `${x}px`);
      dlBtn.style.setProperty('--mouse-y', `${y}px`);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 7;
      const rotateY = (centerX - x) / 7;

      dlBtn.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    });

    dlBtn.addEventListener('mouseleave', () => {
      dlBtn.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    });
  }

  renderRandomItems(safeItem.slug)
}

function getRandomItems(excludeSlug, count = 4) {
  if (!allDownloads || allDownloads.length === 0) return []
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
  if (!allDownloads || allDownloads.length === 0) {
    section.innerHTML = ""
    return
  }
  const randomItems = getRandomItems(currentSlug, 4)
  if (randomItems.length === 0) {
    section.innerHTML = ""
    return
  }
  const grid = document.createElement("div")
  grid.className = "random-items-grid"
  
  randomItems.forEach((item) => {
    const card = document.createElement("article")
    card.className = "random-item-card"
    
    const imageLink = document.createElement("a")
    imageLink.href = `/${escapeHtml(item.slug)}`
    imageLink.className = "random-item-image-wrap"
    imageLink.setAttribute("aria-label", `View ${escapeHtml(item.title)}`)
    
    const img = createSmartItemImage(item.id, 320, 320)
    imageLink.appendChild(img)
    
    const title = document.createElement("h3")
    title.className = "random-item-title"
    title.textContent = item.title
    
    const detailsLink = document.createElement("a")
    detailsLink.href = `/${escapeHtml(item.slug)}`
    detailsLink.className = "random-item-link"
    detailsLink.textContent = "View Details"
    detailsLink.setAttribute("aria-label", `View details for ${escapeHtml(item.title)}`)
    
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
  if (typeof text !== 'string') text = String(text)
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

const HILLTOP_DIRECT_URL = "https://amazing-population.com/b.3FVX0YP/3Hp/v/b/m/V/J/ZsDP0/2sNnzbYQylNvzjMa5oLUTlYr3GNPjhIw3-NsDaAN";
let hilltopFiredThisPage = false;
let hilltopReadyAt = 0;
const HILLTOP_DELAY_MS = 5000;

function updateDownloadButtonText(button, message) {
  button.textContent = message;
  button.setAttribute("aria-disabled", "true");
  button.style.opacity = "0.7";
  button.style.cursor = "not-allowed";
  button.style.pointerEvents = "none";
}

function resetDownloadButton(button) {
  button.textContent = "Download Now";
  button.removeAttribute("aria-disabled");
  button.style.opacity = "";
  button.style.cursor = "";
  button.style.pointerEvents = "";
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

document.addEventListener("keydown", (e) => {
  const el = document.activeElement;
  const btn = el && el.closest ? el.closest(".download-btn[role='button']") : null;
  if (!btn) return;
  if (btn.getAttribute("aria-disabled") === "true") return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    btn.click();
  }
});

document.addEventListener("click", (e) => {
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
    setTimeout(() => { resetDownloadButton(btn); }, 1600);
  }, HILLTOP_DELAY_MS);
}, true);

document.addEventListener("DOMContentLoaded", loadDownloads)

/**
 * Pre-loads images for a set of items and only updates the DOM 
 * once the images are ready to be displayed.
 */
async function refreshRandomItemsSmoothly(currentSlug) {
  const section = document.getElementById("randomItemsSection");
  if (!section || !allDownloads || allDownloads.length === 0) return;

  const randomItems = getRandomItems(currentSlug, 4);
  if (randomItems.length === 0) return;

  // 1. Create the new grid in memory (not yet in the DOM)
  const grid = document.createElement("div");
  grid.className = "random-items-grid";
  
  const imageLoadPromises = [];

  randomItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "random-item-card";
    
    const imageLink = document.createElement("a");
    imageLink.href = `/${escapeHtml(item.slug)}`;
    imageLink.className = "random-item-image-wrap";
    
    // Use your existing image resolver
    const img = createSmartItemImage(item.id, 320, 320);
    
    // Create a promise that resolves when THIS image is loaded
    const imgLoad = new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // Resolve anyway on error to avoid hanging
    });
    imageLoadPromises.push(imgLoad);

    imageLink.appendChild(img);
    
    const title = document.createElement("h3");
    title.className = "random-item-title";
    title.textContent = item.title;
    
    const detailsLink = document.createElement("a");
    detailsLink.href = `/${escapeHtml(item.slug)}`;
    detailsLink.className = "random-item-link";
    detailsLink.textContent = "View Details";
    
    card.appendChild(imageLink);
    card.appendChild(title);
    card.appendChild(detailsLink);
    grid.appendChild(card);
  });

  // 2. Wait for all images to download in the background
  await Promise.all(imageLoadPromises);

  // 3. Swap the content smoothly
  const inner = document.createElement("div");
  inner.className = "random-items-inner";
  inner.style.opacity = "0"; // Start invisible for a fade effect
  inner.style.transition = "opacity 0.5s ease";
  inner.appendChild(grid);

  section.replaceChildren(inner);
  
  // Trigger the fade-in
  requestAnimationFrame(() => {
    inner.style.opacity = "1";
  });
}

// Updated Interval (using 12 seconds as requested)
setInterval(() => {
  if (currentItemSlug) {
    refreshRandomItemsSmoothly(currentItemSlug);
  }
}, 12000);
