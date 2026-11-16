import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadImage, toCanvas, composeBackground, cropRect, clampCrop, portraitCrop, renderPortrait, BACKGROUNDS,
} from './process'
import { detectFace, personMask, enhanceOnServer } from './ai'

const NO_ADJ = { brightness: 0, contrast: 0, auto: false, sharpen: false }
export const freshEdit = (src) => ({ src, rotation: 0, crop: { cx: 0.5, cy: 0.5, zoom: 1 }, adj: NO_ADJ, bg: 'original' })

/**
 * Modal photo editor.
 * original — the photo as uploaded (data URL), kept for "compare" and "reset".
 * initial  — previous editor state (to continue editing), or null.
 * aspect   — width / height of the photo frame in the current template.
 */
export default function PhotoEditor({ original, initial, aspect, shape, grayscale, onApply, onClose }) {
  const [s, setS] = useState(initial ?? freshEdit(original))
  const [history, setHistory] = useState([])
  const [base, setBase] = useState(null) // rotated source canvas
  const [origImg, setOrigImg] = useState(null)
  const [mask, setMask] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [compare, setCompare] = useState(false)
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const drag = useRef(null)

  const push = () => setHistory((h) => [...h.slice(-15), s])
  const update = (patch) => setS((p) => ({ ...p, ...patch }))

  useEffect(() => {
    loadImage(original).then(setOrigImg).catch(() => {})
  }, [original])

  // (re)build the rotated source when the image or rotation changes
  useEffect(() => {
    let alive = true
    setMask(null)
    loadImage(s.src)
      .then((img) => alive && setBase(toCanvas(img, s.rotation)))
      .catch((e) => setError(e.message))
    return () => { alive = false }
  }, [s.src, s.rotation])

  // a background change needs the person mask
  useEffect(() => {
    if (!base || s.bg === 'original' || mask) return
    let alive = true
    setBusy('Отделям човека от фона…')
    personMask(base)
      .then((m) => alive && setMask(m))
      .catch(() => alive && setError('Не успях да заредя AI модела за фона. Проверете интернет връзката.'))
      .finally(() => alive && setBusy(''))
    return () => { alive = false }
  }, [base, s.bg, mask])

  const composite = useMemo(() => (base ? composeBackground(base, mask, s.bg) : null), [base, mask, s.bg])

  // live preview
  useEffect(() => {
    const c = canvasRef.current
    if (!c || !composite) return
    const ctx = c.getContext('2d')
    if (compare && origImg) {
      c.width = 600
      c.height = Math.round(600 / aspect)
      ctx.fillStyle = '#222'
      ctx.fillRect(0, 0, c.width, c.height)
      const k = Math.min(c.width / origImg.naturalWidth, c.height / origImg.naturalHeight)
      const w = origImg.naturalWidth * k, h = origImg.naturalHeight * k
      ctx.drawImage(origImg, (c.width - w) / 2, (c.height - h) / 2, w, h)
      return
    }
    const out = renderPortrait(composite, aspect, s.crop, s.adj, 600)
    c.width = out.width
    c.height = out.height
    ctx.drawImage(out, 0, 0)
  }, [composite, s.crop, s.adj, aspect, compare, origImg])

  // ---- drag to move, wheel / slider to zoom ----
  function onPointerDown(e) {
    if (!composite) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, crop: s.crop }
  }
  function onPointerMove(e) {
    if (!drag.current || !composite) return
    const fw = frameRef.current.clientWidth
    const r = cropRect(composite.width, composite.height, aspect, drag.current.crop)
    const k = r.w / fw
    const cx = drag.current.crop.cx - ((e.clientX - drag.current.x) * k) / composite.width
    const cy = drag.current.crop.cy - ((e.clientY - drag.current.y) * k) / composite.height
    update({ crop: clampCrop(composite.width, composite.height, aspect, { ...drag.current.crop, cx, cy }) })
  }
  const onPointerUp = () => (drag.current = null)
  function setZoom(zoom) {
    if (!composite) return
    zoom = Math.max(1, Math.min(6, zoom))
    update({ crop: clampCrop(composite.width, composite.height, aspect, { ...s.crop, zoom }) })
  }
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const wheel = (e) => {
      e.preventDefault()
      setZoom(s.crop.zoom * Math.pow(1.0015, -e.deltaY))
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  })

  // ---- actions ----
  async function autoPortrait() {
    if (!base) return
    setError('')
    setBusy('Търся лицето…')
    try {
      const face = await detectFace(base)
      if (!face) {
        setError('Не открих лице. Изрежете ръчно — плъзнете снимката и използвайте зуума.')
        return
      }
      push()
      update({ crop: portraitCrop(base.width, base.height, aspect, face) })
    } catch {
      setError('Не успях да заредя AI модела. Проверете интернет връзката.')
    } finally {
      setBusy('')
    }
  }

  async function aiEnhance() {
    if (!composite) return
    setError('')
    setBusy('AI подобрява снимката… (10–30 сек.)')
    try {
      const input = renderPortrait(composite, aspect, s.crop, s.adj, 768).toDataURL('image/jpeg', 0.9)
      const result = await enhanceOnServer(input)
      push()
      setS({ ...freshEdit(result) })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  function rotate() {
    push()
    update({ rotation: (s.rotation + 90) % 360, crop: { cx: 0.5, cy: 0.5, zoom: 1 } })
  }

  function undo() {
    if (!history.length) return
    setS(history[history.length - 1])
    setHistory((h) => h.slice(0, -1))
  }

  function apply() {
    if (!composite) return
    const out = renderPortrait(composite, aspect, s.crop, s.adj, 1100)
    onApply(out.toDataURL('image/jpeg', 0.92), s)
  }

  const adj = (k, v) => update({ adj: { ...s.adj, [k]: v } })

  return (
    <div className="pe-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pe" role="dialog" aria-label="Редакция на снимката">
        <header className="pe-head">
          <h2>Снимка</h2>
          <button className="pe-x" onClick={onClose} aria-label="Затвори">×</button>
        </header>

        <div className="pe-body">
          <div className="pe-stage">
            <div
              ref={frameRef}
              className={`pe-frame pe-shape-${shape}`}
              style={{ aspectRatio: compare ? undefined : aspect, height: compare ? 'auto' : undefined }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <canvas ref={canvasRef} className={grayscale && !compare ? 'gray' : ''} />
              {busy && <div className="pe-busy"><span className="spinner" />{busy}</div>}
            </div>
            <div className="pe-zoom">
              <span>−</span>
              <input type="range" min="1" max="6" step="0.01" value={s.crop.zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              <span>+</span>
            </div>
            <p className="pe-tip">Плъзнете снимката, за да я наместите. Колелцето на мишката или плъзгачът променят мащаба.</p>
          </div>

          <div className="pe-tools">
            {error && <p className="pe-error">{error}</p>}

            <div className="pe-group">
              <h4>AI</h4>
              <button className="pe-ai" onClick={autoPortrait} disabled={!!busy}>
                <b>✨ Само портрет</b>
                <small>Намира лицето и изрязва глава и рамене</small>
              </button>
              <button className="pe-ai" onClick={aiEnhance} disabled={!!busy}>
                <b>🪄 AI подобряване</b>
                <small>Изчиства стари, размазани или нискокачествени снимки</small>
              </button>
              <button
                className="pe-compare"
                onPointerDown={() => setCompare(true)}
                onPointerUp={() => setCompare(false)}
                onPointerLeave={() => setCompare(false)}
              >
                👁 Задръжте, за да сравните с оригинала
              </button>
            </div>

            <div className="pe-group">
              <h4>Фон</h4>
              <div className="chips">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    className={'chip' + (s.bg === b.id ? ' on' : '')}
                    disabled={!!busy}
                    onClick={() => { push(); update({ bg: b.id }) }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pe-group">
              <h4>Светлина</h4>
              <label className="check">
                <input type="checkbox" checked={s.adj.auto} onChange={(e) => adj('auto', e.target.checked)} />
                Автоматично оправяне (цветове и контраст)
              </label>
              <label className="check">
                <input type="checkbox" checked={s.adj.sharpen} onChange={(e) => adj('sharpen', e.target.checked)} />
                По-рязка снимка
              </label>
              <div className="ctl">
                <span>Яркост {s.adj.brightness > 0 ? '+' : ''}{s.adj.brightness}</span>
                <input type="range" min="-50" max="50" value={s.adj.brightness} onChange={(e) => adj('brightness', Number(e.target.value))} />
              </div>
              <div className="ctl">
                <span>Контраст {s.adj.contrast > 0 ? '+' : ''}{s.adj.contrast}</span>
                <input type="range" min="-50" max="50" value={s.adj.contrast} onChange={(e) => adj('contrast', Number(e.target.value))} />
              </div>
            </div>

            <div className="pe-row">
              <button className="secondary sm" onClick={rotate} disabled={!!busy}>⟳ Завърти</button>
              <button className="secondary sm" onClick={undo} disabled={!history.length || !!busy}>↶ Назад</button>
              <button className="secondary sm" onClick={() => { push(); setS(freshEdit(original)) }} disabled={!!busy}>Оригинал</button>
            </div>
          </div>
        </div>

        <footer className="pe-foot">
          <button className="secondary" onClick={onClose}>Отказ</button>
          <button className="primary" onClick={apply} disabled={!composite || !!busy}>Готово</button>
        </footer>
      </div>
    </div>
  )
}
