/**
 * Prefetch + Page Transitions
 * - Prefetches same-origin document links on hover/touchstart (adds <link rel="prefetch">)
 * - Intercepts internal navigation to play a quick fade-out / fade-in transition
 */

;(function () {
  "use strict"

  function getOverlay() {
    return document.getElementById("pageTransitionOverlay")
  }

  function prefersReducedMotion() {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  }

  function shouldAvoidPrefetch() {
    const c = navigator.connection
    if (c?.saveData) return true
    if (typeof c?.effectiveType === "string" && c.effectiveType.includes("2g")) return true
    return false
  }

  function toCleanUrl(href) {
    const url = new URL(href, window.location.href)
    url.hash = ""
    return url
  }

  function isHttpUrl(url) {
    return url.protocol === "http:" || url.protocol === "https:"
  }

  function isInternalLink(anchor) {
    if (!anchor || !anchor.href) return false
    if (anchor.target === "_blank") return false
    if (anchor.hasAttribute("download")) return false

    try {
      const url = new URL(anchor.href, window.location.href)
      if (!isHttpUrl(url)) return false
      return url.origin === window.location.origin
    } catch {
      return false
    }
  }

  function isSameDocumentIgnoringHash(aHref, bHref) {
    try {
      return toCleanUrl(aHref).href === toCleanUrl(bHref).href
    } catch {
      return false
    }
  }

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

  function onPointerOver(e) {
    if (shouldAvoidPrefetch()) return

    const anchor = e.target.closest("a")
    if (!anchor || !isInternalLink(anchor)) return

    if (isSameDocumentIgnoringHash(anchor.href, window.location.href)) return

    const cleanHref = toCleanUrl(anchor.href).href
    prefetchUrl(cleanHref)
  }

  document.addEventListener("pointerover", onPointerOver, { capture: true, passive: true })
  document.addEventListener("touchstart", onPointerOver, { capture: true, passive: true })

  const PENDING_KEY = "pt_overlay_pending"

  function waitForTransition(overlay) {
    if (prefersReducedMotion()) return Promise.resolve()

    const fallbackMs = 300

    return new Promise((resolve) => {
      let done = false

      function finish() {
        if (done) return
        done = true
        overlay.removeEventListener("transitionend", onEnd)
        clearTimeout(t)
        resolve()
      }

      function onEnd(e) {
        if (e.target === overlay) finish()
      }

      overlay.addEventListener("transitionend", onEnd)
      const t = setTimeout(finish, fallbackMs)
    })
  }

  function revealOnLoad() {
    const overlay = getOverlay()
    if (!overlay) return

    const pending = sessionStorage.getItem(PENDING_KEY) === "1"
    sessionStorage.removeItem(PENDING_KEY)

    if (!pending) {
      overlay.classList.remove("active")
      return
    }

    if (prefersReducedMotion()) {
      overlay.classList.remove("active")
      return
    }

    overlay.classList.add("active")
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.remove("active")
      })
    })
  }

  function onLinkClick(e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return

    const anchor = e.target.closest("a")
    if (!anchor || !isInternalLink(anchor)) return

    if (
      anchor.classList.contains("download-btn") ||
      anchor.classList.contains("random-item-link")
    ) {
      return
    }

    if (isSameDocumentIgnoringHash(anchor.href, window.location.href)) return

    if (anchor.classList.contains("download-btn") && anchor.target === "_blank") return

    const overlay = getOverlay()
    if (!overlay) return 

    sessionStorage.setItem(PENDING_KEY, "1")

    if (prefersReducedMotion()) return

    e.preventDefault()

    const dest = toCleanUrl(anchor.href).href

    overlay.classList.add("active")
    waitForTransition(overlay).then(function () {
      window.location.href = dest
    })
  }

  document.addEventListener("click", onLinkClick, { capture: false })

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", revealOnLoad)
  } else {
    revealOnLoad()
  }

  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      sessionStorage.removeItem(PENDING_KEY)
      const overlay = getOverlay()
      if (overlay) overlay.classList.remove("active")
    }
  })
})()
