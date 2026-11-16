// Canvas helpers for the photo editor: rotate, background, crop, light and sharpness.

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Снимката не може да бъде отворена.'))
    img.src = src
  })
}

/** Image → canvas, rotated by 0/90/180/270 and capped at maxSide px. */
export function toCanvas(img, rotation = 0, maxSide = 2000) {
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * s)
  const h = Math.round(img.naturalHeight * s)
  const swap = rotation % 180 !== 0
  const c = document.createElement('canvas')
  c.width = swap ? h : w
  c.height = swap ? w : h
  const ctx = c.getContext('2d')
  ctx.translate(c.width / 2, c.height / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  return c
}

export const BACKGROUNDS = [
  { id: 'original', label: 'Оригинален' },
  { id: 'white', label: 'Бял' },
  { id: 'light', label: 'Светлосив' },
  { id: 'studio', label: 'Студио' },
  { id: 'dark', label: 'Тъмен' },
  { id: 'blur', label: 'Размазан' },
]

/** Replace the background behind the person using the mask (alpha = person). */
export function composeBackground(base, mask, bg) {
  if (bg === 'original' || !mask) return base
  const { width: w, height: h } = base
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')

  if (bg === 'blur') {
    ctx.filter = `blur(${Math.round(w / 60)}px)`
    ctx.drawImage(base, -w * 0.05, -h * 0.05, w * 1.1, h * 1.1)
    ctx.filter = 'none'
  } else if (bg === 'studio') {
    const g = ctx.createRadialGradient(w / 2, h * 0.38, w * 0.05, w / 2, h * 0.5, Math.max(w, h) * 0.75)
    g.addColorStop(0, '#f4f3f1')
    g.addColorStop(1, '#a9a6a1')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  } else {
    ctx.fillStyle = { white: '#ffffff', light: '#e6e5e2', dark: '#2a2a2a' }[bg] || '#fff'
    ctx.fillRect(0, 0, w, h)
  }

  // person = base masked by alpha
  const person = document.createElement('canvas')
  person.width = w
  person.height = h
  const p = person.getContext('2d')
  p.drawImage(mask, 0, 0, w, h)
  p.globalCompositeOperation = 'source-in'
  p.drawImage(base, 0, 0)
  ctx.drawImage(person, 0, 0)
  return out
}

/**
 * Crop window in source pixels.
 * crop = { cx, cy, zoom } — center (0..1 of width/height) and zoom (1 = largest window that fits).
 */
export function cropRect(srcW, srcH, aspect, crop) {
  const coverW = Math.min(srcW, srcH * aspect)
  const w = coverW / crop.zoom
  const h = w / aspect
  let x = crop.cx * srcW - w / 2
  let y = crop.cy * srcH - h / 2
  x = Math.max(0, Math.min(srcW - w, x))
  y = Math.max(0, Math.min(srcH - h, y))
  return { x, y, w, h }
}

/** Keep the crop center inside the image for the current zoom. */
export function clampCrop(srcW, srcH, aspect, crop) {
  const r = cropRect(srcW, srcH, aspect, crop)
  return { ...crop, cx: (r.x + r.w / 2) / srcW, cy: (r.y + r.h / 2) / srcH }
}

/** Head-and-shoulders framing around a detected face. */
export function portraitCrop(srcW, srcH, aspect, face) {
  const coverW = Math.min(srcW, srcH * aspect)
  const h = face.h * 2.6 // face takes ~38% of the height
  const w = h * aspect
  const zoom = Math.max(1, Math.min(6, coverW / w))
  const realH = coverW / zoom / aspect
  const top = face.y - realH * 0.2 // a little air above the head
  return clampCrop(srcW, srcH, aspect, {
    zoom,
    cx: (face.x + face.w / 2) / srcW,
    cy: (top + realH / 2) / srcH,
  })
}

function autoLevels(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]
  for (let i = 0; i < d.length; i += 4) {
    hist[0][d[i]]++
    hist[1][d[i + 1]]++
    hist[2][d[i + 2]]++
  }
  const total = w * h
  const lo = [], hi = []
  for (let c = 0; c < 3; c++) {
    let acc = 0, a = 0, b = 255
    for (let v = 0; v < 256; v++) { acc += hist[c][v]; if (acc > total * 0.01) { a = v; break } }
    acc = 0
    for (let v = 255; v >= 0; v--) { acc += hist[c][v]; if (acc > total * 0.01) { b = v; break } }
    lo.push(a)
    hi.push(Math.max(a + 30, b)) // never stretch too hard
  }
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = ((d[i + c] - lo[c]) * 255) / (hi[c] - lo[c])
      d[i + c] = d[i + c] * 0.35 + v * 0.65 // blend, so the photo still looks natural
    }
  }
  ctx.putImageData(img, 0, 0)
}

function sharpen(ctx, w, h, amount = 0.5) {
  const src = ctx.getImageData(0, 0, w, h)
  const out = ctx.createImageData(w, h)
  const s = src.data, o = out.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) { o[i + c] = s[i + c]; continue }
        const blur = (s[i - 4 + c] + s[i + 4 + c] + s[i - w * 4 + c] + s[i + w * 4 + c]) / 4
        o[i + c] = s[i + c] + (s[i + c] - blur) * amount
      }
      o[i + 3] = s[i + 3]
    }
  }
  ctx.putImageData(out, 0, 0)
}

/** Final portrait: crop + light/contrast + optional auto-fix and sharpen. Returns a canvas. */
export function renderPortrait(src, aspect, crop, adj, outH = 900) {
  const r = cropRect(src.width, src.height, aspect, crop)
  const out = document.createElement('canvas')
  out.height = Math.round(Math.min(outH, r.h * 1.5))
  out.width = Math.round(out.height * aspect)
  const ctx = out.getContext('2d', { willReadFrequently: true })
  ctx.filter = `brightness(${1 + adj.brightness / 100}) contrast(${1 + adj.contrast / 100})`
  ctx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height)
  ctx.filter = 'none'
  if (adj.auto) autoLevels(ctx, out.width, out.height)
  if (adj.sharpen) sharpen(ctx, out.width, out.height)
  return out
}
