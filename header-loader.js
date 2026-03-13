async function loadHeader() {
  const headerPlaceholder = document.getElementById("header-placeholder")
  if (!headerPlaceholder) return
  if (headerPlaceholder.dataset.loadHeader !== "true") {
    return
  }

  if (headerPlaceholder.querySelector(".header-container")) {
    return
  }

  try {
    const headerPath = "/header.html"

    const response = await fetch(headerPath)
    if (!response.ok) throw new Error("Failed to load header")

    const headerContent = await response.text()
    headerPlaceholder.innerHTML = headerContent
    
  } catch (error) {
    console.error("Error loading header:", error)
  }
}

function setupDbToggle() {
  let toggle = document.getElementById('dbToggle')
  let label = document.getElementById('dbToggleLabel')

  if (!toggle) {
    const nav = document.querySelector('.main-nav')
    if (nav) {
      nav.insertAdjacentHTML('afterbegin', `
        <div class="db-toggle-container">
          <label class="db-switch" title="Switch database source">
            <input type="checkbox" id="dbToggle">
            <span class="db-slider"></span>
            <span class="db-label" id="dbToggleLabel">MAIN DB</span>
          </label>
        </div>
      `)
      toggle = document.getElementById('dbToggle')
      label = document.getElementById('dbToggleLabel')
    }
  }

  if (!toggle) return

  const isKits4Beats = document.cookie.includes('db_source=kits4beats')
  toggle.checked = isKits4Beats
  if (label) {
    label.textContent = isKits4Beats ? 'KITS4BEATS' : 'DRUM KITS'
  }

  toggle.addEventListener('change', (e) => {
    const useKits4Beats = e.target.checked
    const maxAge = 60 * 60 * 24 * 365
    
    document.cookie = `db_source=${useKits4Beats ? 'kits4beats' : 'drum_kits'}; path=/; max-age=${maxAge}; samesite=lax`
    
    if (label) {
      label.textContent = useKits4Beats ? 'KITS4BEATS' : 'DRUM KITS'
    }
    
    window.location.reload()
  })
}

function blockRightClick() {
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault()
  })
}

document.addEventListener("DOMContentLoaded", async () => {
  blockRightClick()
  await loadHeader()
  setupDbToggle()
})
