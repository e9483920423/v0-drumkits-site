import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const { data: kits, error } = await supabase
    .from('kits')
    .select('slug, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching kits for sitemap:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const baseUrl = 'https://drumkits4.me'

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/submit</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ${
    kits?.map(kit => `
  <url>
    <loc>${baseUrl}/${encodeURIComponent(kit.slug)}</loc>
    <lastmod>${new Date(kit.created_at || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
    `).join('') || ''
  }
</urlset>`

  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200')
  res.status(200).send(sitemap)
}
