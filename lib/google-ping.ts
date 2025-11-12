export async function pingGoogleSitemap() {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' ? "https://bizbranches.pk" : "https://bizbranches-theta.vercel.app"
    const sitemapUrl = `${baseUrl}/api/sitemap.xml`
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    
    const response = await fetch(pingUrl, { method: 'GET' })
    console.log('Google sitemap ping:', response.ok ? 'Success' : 'Failed', response.status)
    return response.ok
  } catch (error) {
    console.error('Google sitemap ping error:', error)
    return false
  }
}