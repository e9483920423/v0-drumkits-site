const ITEMS_PER_PAGE = 6;
// Remove PUB_URL, IMAGE_EXTENSIONS, and resolveItemImageUrl completely.

const pagination = new Pagination({
  containerId: "paginationContainer",
  itemsPerPage: ITEMS_PER_PAGE,
  paginationLimit: 6,
  onPageChange: (page) => {
    // Now, changing a page triggers a new network request instead of a local array slice
    loadDownloads(page);
  }
});

const cardCache = new Map();

function setListLoading(isLoading) {
  const list = document.getElementById("downloadsList");
  if (!list) return;
  if (isLoading) list.classList.add("is-loading");
  else list.classList.remove("is-loading");
}

// 1. Update this to fetch only a specific page
async function loadDownloads(page = 1) {
  setListLoading(true);
  try {
    // Generate a simple dynamic token (Requires backend validation to match)
    const timestamp = Math.floor(Date.now() / 10000); 
    const dynamicToken = btoa("internal-secure-" + timestamp);

    // Ask the server for ONLY this page's items
    const response = await fetch(`/api/kits?page=${page}&limit=${ITEMS_PER_PAGE}`, {
      headers: { 
        'X-Internal-Sig': dynamicToken 
      }
    });

    if (!response.ok) throw new Error('Network response was not ok');
    
    // The backend should now return { data: [...], totalItems: 6861 }
    const { data, totalItems } = await response.json();

    cardCache.clear();
    
    // Update pagination with the total count from the server
    pagination.setTotalItems(totalItems);
    renderDownloads(data || []);
    pagination.render();

  } catch (error) {
    console.error("Error loading downloads:", error);
    const list = document.getElementById("downloadsList");
    if (list) {
      list.innerHTML = '<p class="loading">Failed to load data. Please refresh.</p>';
    }
  } finally {
    setListLoading(false);
  }
}

// 2. Simplify the image creation (No more probing)
function createSmartImage(imageUrl) {
  const img = document.createElement("img");
  img.alt = "";
  img.loading = "eager";
  img.decoding = "async";
  img.width = 320;
  img.height = 320;
  // The backend should provide the exact image URL in the item data
  img.src = imageUrl || "/errors/default.jpg"; 
  return img;
}

// 3. Update buildCard to use the new image logic
function buildCard(item) {
  const card = document.createElement("div");
  card.className = "download-item";
  const imageWrap = document.createElement("div");
  imageWrap.className = "item-image";
  
  // Pass the image URL directly from the backend data
  const img = createSmartImage(item.imageUrl); 
  imageWrap.appendChild(img);
  
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const moveX = (x - 0.5) * 20; 
    const moveY = (y - 0.5) * 20;

    img.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
  });

  card.addEventListener("mouseleave", () => {
    img.style.transform = `scale(1) translate(0, 0)`;
  });

  if (item.category) {
    const badge = document.createElement("span");
    badge.className = "category-badge";
    badge.textContent = item.category;
    imageWrap.appendChild(badge);
  }

  const content = document.createElement("div");
  content.className = "item-content";
  content.innerHTML = `
    <h3 class="item-title">${escapeHtml(item.title)}</h3>
    ${item.description && item.description !== "null"
      ? `<p class="item-description">${escapeHtml(item.description)}</p>`
      : ''
    }
    <a href="/${item.slug}" class="download-btn">View Details</a>
  `;

  card.appendChild(imageWrap);
  card.appendChild(content);
  return card;
}

// renderDownloads and escapeHtml remain largely the same
function renderDownloads(downloads) {
  const list = document.getElementById("downloadsList");
  if (!list) return;

  if (!downloads || downloads.length === 0) {
    list.innerHTML = '<p class="loading">No items available.</p>';
    return;
  }

  const frag = document.createDocumentFragment();

  downloads.forEach((item) => {
    if (!cardCache.has(item.id)) {
      cardCache.set(item.id, buildCard(item));
    }
    frag.appendChild(cardCache.get(item.id));
  });

  list.replaceChildren(frag);
}

function escapeHtml(text) {
  if (text == null) return '';
  if (typeof text !== 'string') text = String(text);
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

document.addEventListener("DOMContentLoaded", () => loadDownloads(1));
