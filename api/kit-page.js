import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL =
  process.env.drumkits_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fwrnbfwzolplbmiaaeme.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.drumkits_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLIC_ANON_KEY;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const baseUrl = `http://${req.headers.host || 'localhost'}`
  const parsedUrl = new URL(req.url, baseUrl)
  
  let parsedSlug = req.query?.slug || parsedUrl.searchParams.get('slug')
  
  if (!parsedSlug) {
    const segments = parsedUrl.pathname.split('/').filter(Boolean)
    const lastSegment = segments.pop() || ''
    if (lastSegment !== 'kit-page' && lastSegment !== 'api') {
      parsedSlug = lastSegment
    }
  }
  
  const slug = decodeURIComponent(parsedSlug || '')

  if (!slug) {
    return res.redirect('/')
  }

  // Read cookie
  const cookies = (req.headers.cookie || '').split(';');
  let dbSource = 'drum_kits';
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'db_source' && value === 'kits4beats') {
      dbSource = 'kits4beats_drumkits';
      break;
    }
  }

  let { data: kit, error } = await supabase
    .from(dbSource)
    .select('title, description, slug, id')
    .eq('slug', slug)
    .single()

  // If not found, try the other table to keep old direct links working
  if (error || !kit) {
    const fallbackSource = dbSource === 'drum_kits' ? 'kits4beats_drumkits' : 'drum_kits';
    const fallbackRes = await supabase
      .from(fallbackSource)
      .select('title, description, slug, id')
      .eq('slug', slug)
      .single()
    kit = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error || !kit) {
    return res.redirect('/')
  }

  const title = kit.title || 'Drum Kit'
  const description = kit.description
    ? kit.description.slice(0, 160)
    : `♫ Download ${title} here! ♫`
  const imageUrl = `https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev/${kit.id}.jpg`
  const pageUrl = `https://drumkits4.me/${encodeURIComponent(kit.slug)}`

  const htmlPath = path.join(process.cwd(), 'kit-page', 'index.html')
  let html = fs.readFileSync(htmlPath, 'utf8')

  const metaTags = `
    <title>${escapeHtml(title)} 𝄞 drumkits4.me</title>
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
