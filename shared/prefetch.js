/**
 * Prefetch only
 * - Prefetches same-origin document links on hover/touchstart (adds <link rel="prefetch">)
 */

;(function () {
  "use strict"

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
})()
