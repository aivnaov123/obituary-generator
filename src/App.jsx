import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Sheet from './Sheet'
import DesignPanel from './DesignPanel'
import PhotoEditor from './photo/PhotoEditor'
import { TYPES, CLOSINGS, buildBody, buildEvent, variantCount } from './templates'
import { LAYOUTS, resolveDesign } from './design'
import { suggestedDate, yearsSince, addDays, addMonths, formatBg, toICS } from './dates'

const SHEET_W = 794
const SHEET_H = 1123

const initial = {
  type: 'death',
  gender: 'm',
  name: '',
  relation: '',
  birth: '',
  death: '',
  years: 2,
  eventDate: '',
  eventTime: '',
  eventPlace: '',
  closing: CLOSINGS[0],
  family: 'От семейството',
  photo: null, // final edited portrait shown on the necrolog
  photoOriginal: null, // as uploaded
  photoEdit: null, // editor state, so editing can continue later
  grayscale: true,
}

/** Scales the A4 sheet to fit the width of its container. */
function Fit({ children, fixedScale }) {
  const ref = useRef(null)
  const [scale, setScale] = useState(fixedScale ?? 0.5)
  useLayoutEffect(() => {
    if (fixedScale) return
    const el = ref.current
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / SHEET_W)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [fixedScale])
  return (
    <div ref={ref} className="fit" style={{ height: SHEET_H * scale, width: fixedScale ? SHEET_W * fixedScale : undefined }}>
      <div className="fit-inner" style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  )
}

export default function App() {
  const [f, setF] = useState(initial)
  const [variant, setVariant] = useState(0)
  const [customBody, setCustomBody] = useState(null)
  const [tab, setTab] = useState('text')
  const [editorOpen, setEditorOpen] = useState(false)

  // design state
  const [layoutId, setLayoutId] = useState('classic')
  const [overrides, setOverrides] = useState({})
  const [photoSize, setPhotoSize] = useState(100)
  const [fields, setFields] = useState({})
  const [picked, setPicked] = useState('page')
  const previewRef = useRef(null)

  const d = resolveDesign(layoutId, overrides, photoSize, fields)
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  const generated = useMemo(() => buildBody(f, variant), [f, variant])
  const body = customBody ?? generated
  const event = buildEvent(f)

  useEffect(() => {
    document.title = f.name.trim() ? `Некролог — ${f.name.trim()}` : 'Некролог онлайн'
  }, [f.name])

  function chooseType(type) {
    setF((p) => {
      const years = type === 'yearly' ? yearsSince(p.death) : p.years
      return { ...p, type, years, eventDate: suggestedDate(type, p.death, years) }
    })
    setVariant(0)
    setCustomBody(null)
  }

  function chooseLayout(id) {
    setLayoutId(id)
    setOverrides({}) // a new template brings its own colors, frames and shapes
  }

  function onPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const r = new FileReader()
    r.onload = () => {
      setF((p) => ({ ...p, photo: r.result, photoOriginal: r.result, photoEdit: null }))
      setEditorOpen(true)
    }
    r.readAsDataURL(file)
    e.target.value = ''
  }

  const photoAspect = d.photoShape === 'circle' ? 1 : (d.photoW ?? 250) / (d.photoH ?? 320)

  function pickFromPreview(id) {
    setPicked(id)
    setTab('design')
  }

  const reminders = f.death
    ? [
        { title: `40 дни — ${f.name || 'помен'}`, date: addDays(f.death, 39) },
        { title: `6 месеца — ${f.name || 'помен'}`, date: addMonths(f.death, 6) },
        { title: `1 година — ${f.name || 'помен'}`, date: addMonths(f.death, 12) },
      ]
    : []

  function downloadICS() {
    const blob = new Blob([toICS(reminders)], { type: 'text/calendar' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'pomeni.ics'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const textTab = (
    <>
      <section>
        <h3>Вид</h3>
        <div className="chips">
          {TYPES.map((t) => (
            <button key={t.id} className={'chip' + (f.type === t.id ? ' on' : '')} onClick={() => chooseType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Починалият</h3>
        <label>
          Име, презиме, фамилия
          <input value={f.name} onChange={set('name')} placeholder="Иван Петров Иванов" />
        </label>
        <div className="row">
          <label>
            Пол
            <select value={f.gender} onChange={set('gender')}>
              <option value="m">Мъж</option>
              <option value="f">Жена</option>
            </select>
          </label>
          <label className="grow">
            Кой е бил за вас
            <input value={f.relation} onChange={set('relation')} placeholder={f.gender === 'f' ? 'съпруга, майка и баба' : 'съпруг, баща и дядо'} />
          </label>
        </div>
        <div className="row">
          <label>
            Роден(а)
            <input type="date" value={f.birth} onChange={set('birth')} />
          </label>
          <label>
            Починал(а)
            <input
              type="date"
              value={f.death}
              onChange={(e) => {
                const death = e.target.value
                setF((p) => ({ ...p, death, eventDate: suggestedDate(p.type, death, p.years) || p.eventDate }))
              }}
            />
          </label>
        </div>
        {f.type === 'yearly' && (
          <label>
            Години от смъртта
            <input
              type="number"
              min="1"
              value={f.years}
              onChange={(e) => {
                const years = Math.max(1, Number(e.target.value) || 1)
                setF((p) => ({ ...p, years, eventDate: suggestedDate('yearly', p.death, years) || p.eventDate }))
              }}
            />
          </label>
        )}
        <label>
          Снимка {f.type === 'death' && <small>(по традиция първата вест често е без снимка)</small>}
          <input type="file" accept="image/*" onChange={onPhoto} />
        </label>
        {f.photo && (
          <div className="row tight">
            <label className="check">
              <input type="checkbox" checked={f.grayscale} onChange={(e) => setF((p) => ({ ...p, grayscale: e.target.checked }))} />
              Черно-бяла
            </label>
            <button className="link" onClick={() => setF((p) => ({ ...p, photo: null, photoOriginal: null, photoEdit: null }))}>Махни снимката</button>
          </div>
        )}
        {f.photo && (
          <button className="secondary edit-photo" onClick={() => setEditorOpen(true)}>✂ Изрежи и оправи снимката (AI)</button>
        )}
      </section>

      <section>
        <h3>{f.type === 'death' ? 'Поклонение' : 'Помен'}</h3>
        <div className="row">
          <label>
            Дата {f.type !== 'death' && f.death && <small>(предложена)</small>}
            <input type="date" value={f.eventDate} onChange={set('eventDate')} />
          </label>
          <label>
            Час
            <input type="time" value={f.eventTime} onChange={set('eventTime')} />
          </label>
        </div>
        <label>
          Място
          <input value={f.eventPlace} onChange={set('eventPlace')} placeholder="храм „Св. Николай“, гр. Пловдив" />
        </label>
      </section>

      <section>
        <h3>Текст</h3>
        <textarea rows={4} value={body} onChange={(e) => setCustomBody(e.target.value)} />
        <div className="row tight">
          <button
            className="link"
            onClick={() => {
              setVariant((v) => (v + 1) % variantCount(f.type))
              setCustomBody(null)
            }}
          >
            ↻ Друг вариант
          </button>
          {customBody !== null && (
            <button className="link" onClick={() => setCustomBody(null)}>Върни готовия текст</button>
          )}
        </div>
        <div className="row">
          <label className="grow">
            Завършек
            <select value={f.closing} onChange={set('closing')}>
              {CLOSINGS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="grow">
            Подпис
            <input value={f.family} onChange={set('family')} />
          </label>
        </div>
      </section>

      {reminders.length > 0 && f.type === 'death' && (
        <section className="reminders">
          <h3>Предстоящи помени</h3>
          <ul>
            {reminders.map((r) => (
              <li key={r.title}>
                <span>{r.title.split(' — ')[0]}</span>
                <b>{formatBg(r.date)}</b>
              </li>
            ))}
          </ul>
          <button className="secondary" onClick={downloadICS}>📅 Добави в календара</button>
          <p className="note">Датите са ориентировъчни — уточнете ги със свещеника.</p>
        </section>
      )}
    </>
  )

  const designTab = (
    <>
      <section>
        <h3>Шаблон</h3>
        <div className="layouts">
          {LAYOUTS.map((l) => (
            <button key={l.id} className={'layout-card' + (layoutId === l.id ? ' on' : '')} onClick={() => chooseLayout(l.id)}>
              <Fit fixedScale={0.13}>
                <Sheet f={f} body={body} event={event} d={resolveDesign(l.id, {}, 100, fields)} placeholder />
              </Fit>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </section>
      <DesignPanel
        d={d}
        picked={picked}
        setPicked={setPicked}
        hasPhoto={!!f.photo}
        onEditPhoto={() => setEditorOpen(true)}
        overrides={overrides}
        setOverrides={setOverrides}
        photoSize={photoSize}
        setPhotoSize={setPhotoSize}
        fields={fields}
        setFields={setFields}
        previewRef={previewRef}
        resetAll={() => {
          setOverrides({})
          setFields({})
          setPhotoSize(100)
        }}
      />
    </>
  )

  return (
    <div className="app">
      <aside className="editor">
        <header className="brand">
          <span className="brand-cross">✝</span>
          <div>
            <h2>Некролог онлайн</h2>
            <p>Готов за печат за 2 минути</p>
          </div>
        </header>

        <div className="tabs">
          <button className={tab === 'text' ? 'on' : ''} onClick={() => setTab('text')}>1. Съдържание</button>
          <button className={tab === 'design' ? 'on' : ''} onClick={() => setTab('design')}>2. Дизайн</button>
        </div>

        {tab === 'text' ? textTab : designTab}

        <div className="actions">
          <button className="primary" onClick={() => window.print()}>Печат / Запази PDF</button>
        </div>
      </aside>

      <main className="preview">
        <p className="hint">Кликнете върху елемент в некролога, за да промените дизайна му</p>
        <div ref={previewRef} className="preview-sheet">
          <Fit>
            <Sheet f={f} body={body} event={event} d={d} picked={tab === 'design' ? picked : null} onPick={pickFromPreview} />
          </Fit>
        </div>
      </main>

      {editorOpen && f.photoOriginal && (
        <PhotoEditor
          original={f.photoOriginal}
          initial={f.photoEdit}
          aspect={photoAspect}
          shape={d.photoShape}
          grayscale={f.grayscale}
          onClose={() => setEditorOpen(false)}
          onApply={(photo, photoEdit) => {
            setF((p) => ({ ...p, photo, photoEdit }))
            setEditorOpen(false)
          }}
        />
      )}

      <div className="print-only">
        <Sheet f={f} body={body} event={event} d={d} />
      </div>
    </div>
  )
}
