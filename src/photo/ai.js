// In-browser AI with Google MediaPipe (free, runs on the user's device, photo never leaves it).
// Models are loaded lazily, only when the user presses the button.

const MODELS = {
  face: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
  selfie: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
}

let visionP, faceP, segP

async function vision() {
  if (!visionP) {
    visionP = import('@mediapipe/tasks-vision').then(async (mp) => ({
      mp,
      fileset: await mp.FilesetResolver.forVisionTasks('/mediapipe/wasm'),
    }))
  }
  return visionP
}

async function faceDetector() {
  if (!faceP) {
    faceP = vision().then(({ mp, fileset }) =>
      mp.FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODELS.face, delegate: 'CPU' },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.4,
      }),
    )
    faceP.catch(() => (faceP = null))
  }
  return faceP
}

async function segmenter() {
  if (!segP) {
    segP = vision().then(({ mp, fileset }) =>
      mp.ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODELS.selfie, delegate: 'CPU' },
        runningMode: 'IMAGE',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      }),
    )
    segP.catch(() => (segP = null))
  }
  return segP
}

/** Largest face in the canvas → {x, y, w, h} in canvas pixels, or null. */
export async function detectFace(canvas) {
  const det = await faceDetector()
  const { detections } = det.detect(canvas)
  if (!detections?.length) return null
  const best = detections
    .map((d) => d.boundingBox)
    .sort((a, b) => b.width * b.height - a.width * a.height)[0]
  return { x: best.originX, y: best.originY, w: best.width, h: best.height }
}

/** Person mask for the canvas → canvas (same size) whose alpha = person. */
export async function personMask(canvas) {
  const seg = await segmenter()
  const result = seg.segment(canvas)
  try {
    const masks = result.confidenceMasks || []
    const m = masks[masks.length - 1] // 1 mask = person; 2 masks = [background, person]
    const data = m.getAsFloat32Array()
    const { width, height } = m

    // Safety: if the border is mostly "person", the mask is inverted.
    let border = 0, n = 0
    for (let x = 0; x < width; x += 4) { border += data[x] + data[(height - 1) * width + x]; n += 2 }
    const invert = border / n > 0.5

    const out = document.createElement('canvas')
    out.width = width
    out.height = height
    const ctx = out.getContext('2d')
    const img = ctx.createImageData(width, height)
    for (let i = 0; i < data.length; i++) {
      const v = invert ? 1 - data[i] : data[i]
      img.data[i * 4 + 3] = Math.max(0, Math.min(255, (v - 0.15) * 1.4 * 255)) // a bit of contrast on the edge
    }
    ctx.putImageData(img, 0, 0)

    // scale to the source size and soften the edge
    const full = document.createElement('canvas')
    full.width = canvas.width
    full.height = canvas.height
    const fctx = full.getContext('2d')
    fctx.filter = `blur(${Math.max(1, Math.round(canvas.width / 400))}px)`
    fctx.drawImage(out, 0, 0, canvas.width, canvas.height)
    return full
  } finally {
    result.close?.()
  }
}

/** Server-side AI face restoration (GFPGAN via Replicate). Returns a data URL. */
export async function enhanceOnServer(dataUrl) {
  const r = await fetch('/api/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl }),
  })
  let body = {}
  try { body = await r.json() } catch { /* not JSON */ }
  if (!r.ok || !body.image) {
    if (r.status === 404) throw new Error('AI подобряването работи само на сайта във Vercel (или с `vercel dev`).')
    throw new Error(body.error || 'AI подобряването не успя. Опитайте отново.')
  }
  return body.image
}
