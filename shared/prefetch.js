/**
 * Prefetch + Page Transitions
 * - Prefetches same-origin links on hover/touchstart (adds <link rel="prefetch">)
 * - Intercepts internal navigation to play a quick fade-out / fade-in transition
 */

;(function () {
  "use strict"

  /* ---------- Prefetch on hover ---------- */

  const prefetched = new Set()

  function prefetchUrl(href) {
    if (prefetched.has(href)) return
    prefetched.add(href)

    const link = document.createElement("link")
    link.rel = "prefetch"
    link.href = href
    link.as = "document"
    document.head.appendChild(link)
  }

  function isInternalLink(anchor) {
    if (!anchor || !anchor.href) return false
    if (anchor.target === "_blank") return false
    if (anchor.hasAttribute("download")) return false

    try {
      const url = new URL(anchor.href, window.location.origin)
      return url.origin === window.location.origin
    } catch {
      return false
    }
  }

  function onPointerEnter(e) {
    const anchor = e.target.closest("a")
    if (anchor && isInternalLink(anchor)) {
      prefetchUrl(anchor.href)
    }
  }

  document.addEventListener("pointerenter", onPointerEnter, { capture: true, passive: true })
  document.addEventListener("touchstart", onPointerEnter, { capture: true, passive: true })

  /* ---------- Page Transition ---------- */

  const TRANSITION_MS = 150 // matches the CSS transition duration

  function getOverlay() {
    return document.getElementById("pageTransitionOverlay")
  }

  // On page load, if the overlay exists and is active (from the previous page's
  // fade-out), fade it back in by removing the active class after a brief tick.
  function fadeInOnLoad() {
    const overlay = getOverlay()
    if (!overlay) return

    // Start with the overlay visible (black screen) so the new page content
    // is hidden while it paints, then fade it out to reveal the page.
    overlay.classList.add("active")

    // Use rAF so the browser has a chance to paint with the overlay visible
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.remove("active")
      })
    })
  }

  // Intercept click on internal links: fade out, then navigate
  function onLinkClick(e) {
    // Don't interfere with modified clicks (new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return

    const anchor = e.target.closest("a")
    if (!anchor || !isInternalLink(anchor)) return

    // Don't transition if it's the same page
    if (anchor.href === window.location.href) return

    // Skip download buttons (those open in new tabs with special behaviour)
    if (anchor.classList.contains("download-btn") && anchor.target === "_blank") return

    const overlay = getOverlay()
    if (!overlay) return // graceful fallback — just do normal nav

    e.preventDefault()
    overlay.classList.add("active")

    setTimeout(function () {
      window.location.href = anchor.href
    }, TRANSITION_MS)
  }

  document.addEventListener("click", onLinkClick, { capture: false })

  // Run fade-in once the DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fadeInOnLoad)
  } else {
    fadeInOnLoad()
  }

  // Also handle bfcache (back/forward)
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      fadeInOnLoad()
    }
  })
})()
