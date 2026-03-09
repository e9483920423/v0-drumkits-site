import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // Extract slug robustly, ignoring query parameters like ?ref=twitter
  const baseUrl = `http://${req.headers.host || 'localhost'}`
  const parsedUrl = new URL(req.url, baseUrl)
  const slug = decodeURIComponent(parsedUrl.pathname.split('/').filter(Boolean).pop() || '')

  if (!slug) {
    return res.redirect('/')
  }

  // Fetch the kit from Supabase
  const { data: kit, error } = await supabase
    .from('kits')
    .select('title, description, slug, id')
    .eq('slug', slug)
    .single()

  if (error || !kit) {
    return res.redirect('/')
  }

  const title = kit.title || 'Drum Kit'
  const description = kit.description
    ? kit.description.slice(0, 160)
    : `Download the ${title} high-quality drum kit — free on drumkits4.me`
  const imageUrl = `https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev/${kit.id}.jpg`
  const pageUrl = `https://drumkits4.me/${encodeURIComponent(kit.slug)}`

  // Read your existing HTML shell
  const htmlPath = path.join(process.cwd(), 'kit-page', 'index.html')
  let html = fs.readFileSync(htmlPath, 'utf8')

  // Inject pre-filled meta tags into <head>
  const metaTags = `
    <title>${escapeHtml(title)} | drumkits4.me</title>
    <link rel="canonical" href="${pageUrl}">
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "${escapeHtml(title)}",
      "description": "${escapeHtml(description)}",
      "category": "Audio Files > Drum Kits",
      "url": "${pageUrl}",
      "image": "${imageUrl}",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }
    }
    </script>`

  // Replace the existing placeholder <title> with our injected tags
  html = html.replace(/<title>.*?<\/title>/, metaTags)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(html)
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
