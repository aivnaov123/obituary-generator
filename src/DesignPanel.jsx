import { useLayoutEffect, useRef, useState } from 'react'
import {
  ELEMENTS, TEXT_FIELDS, FONTS, PAGE_FRAMES, PHOTO_SHAPES, PHOTO_FRAMES, SYMBOLS, ACCENTS, PAPERS,
} from './design'

function rgbToHex(rgb) {
  const m = rgb.match(/\d+/g)
  if (!m) return '#000000'
  return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')
}

function Swatches({ colors, value, onChange }) {
  return (
    <div className="swatches">
      {colors.map((c) => (
        <button key={c} className={'sw' + (value?.toLowerCase() === c ? ' on' : '')} style={{ background: c }} onClick={() => onChange(c)} title={c} />
      ))}
      <label className="sw custom" title="Друг цвят">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <span>+</span>
      </label>
    </div>
  )
}

function Chips({ items, value, onChange, render }) {
  return (
    <div className="chips">
      {items.map((it) => (
        <button key={it.id} className={'chip' + (value === it.id ? ' on' : '')} onClick={() => onChange(it.id)}>
          {render ? render(it) : it.label}
        </button>
      ))}
    </div>
  )
}

export default function DesignPanel({
  d, picked, setPicked, hasPhoto, onEditPhoto, overrides, setOverrides, photoSize, setPhotoSize, fields, setFields, previewRef, resetAll,
}) {
  const panelRef = useRef(null)
  const [comp, setComp] = useState(null) // computed style of the picked text element
  const isText = TEXT_FIELDS.some((t) => t.id === picked)
  const fs = fields[picked] || {}
  const ov = (k, v) => setOverrides((p) => ({ ...p, [k]: v }))
  const setField = (patch) => setFields((p) => ({ ...p, [picked]: { ...p[picked], ...patch } }))

  // Read the element's real (template) style so toggles and color pickers start from what you see.
  useLayoutEffect(() => {
    if (!isText) return
    const el = previewRef.current?.querySelector(`[data-field="${picked}"]`)
    if (!el) {
      if (comp) setComp(null)
      return
    }
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize) || 16
    const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) / size
    const next = {
      bold: Number(cs.fontWeight) >= 600,
      italic: cs.fontStyle === 'italic',
      upper: cs.textTransform === 'uppercase',
      color: rgbToHex(cs.color),
      spacing: Math.round(ls * 100) / 100,
    }
    if (JSON.stringify(next) !== JSON.stringify(comp)) setComp(next)
  })

  useLayoutEffect(() => {
    panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [picked])

  const label = ELEMENTS.find((e) => e.id === picked)?.label

  return (
    <section ref={panelRef} className="design-panel">
      <h3>Елемент</h3>
      <div className="chips small">
        {ELEMENTS.map((e) => (
          <button key={e.id} className={'chip' + (picked === e.id ? ' on' : '')} onClick={() => setPicked(e.id)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="panel-body">
        <div className="panel-title">{label}</div>

        {picked === 'page' && (
          <>
            <div className="ctl">
              <span>Акцентен цвят</span>
              <Swatches colors={ACCENTS} value={d.accent} onChange={(c) => ov('accent', c)} />
            </div>
            <div className="ctl">
              <span>Фон</span>
              <Swatches colors={PAPERS} value={d.paper} onChange={(c) => ov('paper', c)} />
            </div>
            <div className="ctl">
              <span>Цвят на текста</span>
              <Swatches colors={['#111111', '#2e2312', '#24302a', '#3a312a', '#f1eee8']} value={d.ink} onChange={(c) => ov('ink', c)} />
            </div>
            <div className="ctl">
              <span>Рамка на страницата</span>
              <Chips items={PAGE_FRAMES} value={d.pageFrame} onChange={(v) => ov('pageFrame', v)} />
            </div>
          </>
        )}

        {picked === 'photo' && (
          <>
            {!hasPhoto && <p className="note">Качете снимка в „Съдържание“, за да я видите тук.</p>}
            {hasPhoto && (
              <button className="secondary edit-photo" onClick={onEditPhoto}>✂ Изрежи и оправи снимката (AI)</button>
            )}
            <div className="ctl">
              <span>Форма</span>
              <Chips
                items={PHOTO_SHAPES}
                value={d.photoShape}
                onChange={(v) => ov('photoShape', v)}
                render={(it) => (
                  <>
                    <i className={`shape-icon shape-${it.id}`} /> {it.label}
                  </>
                )}
              />
            </div>
            <div className="ctl">
              <span>Рамка</span>
              <Chips items={PHOTO_FRAMES} value={d.photoFrame} onChange={(v) => ov('photoFrame', v)} />
            </div>
            <div className="ctl">
              <span>Размер — {photoSize}%</span>
              <input type="range" min="60" max="140" value={photoSize} onChange={(e) => setPhotoSize(Number(e.target.value))} />
            </div>
            <label className="check">
              <input type="checkbox" checked={!!fields.photo?.hidden} onChange={(e) => setFields((p) => ({ ...p, photo: { hidden: e.target.checked } }))} />
              Скрий снимката
            </label>
          </>
        )}

        {isText && (
          <>
            {picked === 'cross' && (
              <div className="ctl">
                <span>Символ</span>
                <Chips items={SYMBOLS} value={d.symbol} onChange={(v) => ov('symbol', v)} />
              </div>
            )}
            {picked !== 'cross' && (
              <div className="ctl">
                <span>Шрифт</span>
                <select value={fs.font || ''} onChange={(e) => setField({ font: e.target.value || undefined })}>
                  <option value="">По шаблона</option>
                  {FONTS.map((x) => (
                    <option key={x.name} value={x.name} style={{ fontFamily: x.name }}>{x.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="ctl">
              <span>Размер — {fs.scale || 100}%</span>
              <input type="range" min="50" max="200" step="5" value={fs.scale || 100} onChange={(e) => setField({ scale: Number(e.target.value) })} />
            </div>
            <div className="ctl">
              <span>Цвят</span>
              <Swatches
                colors={['#111111', d.accent, '#7a2e2e', '#6b6b6b', '#ffffff']}
                value={fs.color || comp?.color || '#111111'}
                onChange={(c) => setField({ color: c })}
              />
            </div>
            {picked !== 'cross' && (
              <>
                <div className="ctl">
                  <span>Стил</span>
                  <div className="toggles">
                    <button className={'tg' + (comp?.bold ? ' on' : '')} onClick={() => setField({ bold: !comp?.bold })}><b>B</b></button>
                    <button className={'tg' + (comp?.italic ? ' on' : '')} onClick={() => setField({ italic: !comp?.italic })}><i>I</i></button>
                    <button className={'tg' + (comp?.upper ? ' on' : '')} onClick={() => setField({ upper: !comp?.upper })}>АА</button>
                    <span className="sep" />
                    {['left', 'center', 'right'].map((a) => (
                      <button key={a} className={'tg' + (fs.align === a ? ' on' : '')} onClick={() => setField({ align: a })} title={a}>
                        {a === 'left' ? '⇤' : a === 'center' ? '↔' : '⇥'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ctl">
                  <span>Разредка на буквите</span>
                  <input type="range" min="-0.05" max="0.6" step="0.01" value={fs.spacing ?? comp?.spacing ?? 0} onChange={(e) => setField({ spacing: Number(e.target.value) })} />
                </div>
              </>
            )}
            <div className="row tight">
              <label className="check">
                <input type="checkbox" checked={!!fs.hidden} onChange={(e) => setField({ hidden: e.target.checked })} />
                Скрий
              </label>
              <button className="link" onClick={() => setFields((p) => ({ ...p, [picked]: undefined }))}>Нулирай полето</button>
            </div>
          </>
        )}
      </div>

      <button className="link reset-all" onClick={resetAll}>Върни целия дизайн по шаблона</button>
    </section>
  )
}
