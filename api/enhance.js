// Vercel serverless function: AI face restoration with GFPGAN (Apache-2.0) on Replicate.
// Setup: add REPLICATE_API_TOKEN in Vercel → Project → Settings → Environment Variables.
// Cost: a few tenths of a cent per photo, billed to your Replicate account.

const DEFAULT_VERSION = '9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3' // tencentarc/gfpgan

export const config = { maxDuration: 60 }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })

  // Basic protection: only our own site may call this (stops others from spending your credits).
  const origin = req.headers.origin || ''
  const host = req.headers.host || ''
  if (origin && !origin.endsWith(host) && !origin.includes('localhost')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return res.status(501).json({ error: 'AI подобряването още не е настроено (липсва REPLICATE_API_TOKEN във Vercel).' })
  }

  const image = req.body?.image
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Липсва снимка.' })
  }
  if (image.length > 3_000_000) return res.status(413).json({ error: 'Снимката е твърде голяма.' })

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  try {
    let r = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { ...headers, Prefer: 'wait=50' },
      body: JSON.stringify({
        version: process.env.REPLICATE_GFPGAN_VERSION || DEFAULT_VERSION,
        input: { img: image, version: 'v1.4', scale: 1 },
      }),
    })
    let p = await r.json()
    if (!r.ok && !p.id) throw new Error(p.detail || p.error || `Replicate ${r.status}`)

    const started = Date.now()
    while (!['succeeded', 'failed', 'canceled'].includes(p.status) && Date.now() - started < 50_000) {
      await sleep(1500)
      p = await (await fetch(p.urls.get, { headers })).json()
    }
    if (p.status !== 'succeeded') throw new Error(p.error || 'AI обработката не завърши навреме.')

    const url = Array.isArray(p.output) ? p.output[0] : p.output
    const out = await fetch(url)
    const buf = Buffer.from(await out.arrayBuffer())
    const type = out.headers.get('content-type') || 'image/png'
    return res.status(200).json({ image: `data:${type};base64,${buf.toString('base64')}` })
  } catch (e) {
    console.error(e)
    return res.status(502).json({ error: 'AI подобряването не успя. Опитайте отново по-късно.' })
  }
}
