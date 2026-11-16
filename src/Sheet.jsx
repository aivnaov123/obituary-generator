import { TYPES, subFor } from './templates'
import { fieldStyle } from './design'
import { yearOf } from './dates'
import { Corners, Branch, Wreath, Candle, PhotoPlaceholder } from './Decor'

/**
 * One A4 necrolog (794 x 1123 px).
 * d = effective design (template defaults + user overrides), see resolveDesign().
 * onPick/picked are only passed in the interactive preview.
 */
export default function Sheet({ f, body, event, d, picked, onPick, placeholder }) {
  const t = TYPES.find((x) => x.id === f.type)
  const sub = subFor(f.type, f.years)
  const span = [yearOf(f.birth), yearOf(f.death)].filter(Boolean).join(' – ')
  const fs = d.fields || {}

  const pick = (id) => (onPick ? (e) => { e.stopPropagation(); onPick(id) } : undefined)
  const cls = (id, base) => `${base}${onPick ? ' pickable' : ''}${picked === id ? ' picked' : ''}`
  const T = (id, Tag, base, content) =>
    !content || fs[id]?.hidden ? null : (
      <Tag data-field={id} className={cls(id, base)} style={fieldStyle(fs[id])} onClick={pick(id)}>
        {content}
      </Tag>
    )

  const k = (d.photoSize ?? 100) / 100
  const baseW = d.photoW ?? 250
  const baseH = d.photoH ?? 320
  const pw = (d.photoShape === 'circle' ? baseW * 1.05 : baseW) * k
  const ph = d.photoShape === 'circle' ? pw : baseH * k
  const photoSrc = f.photo
  const showPhoto = (photoSrc || placeholder) && !fs.photo?.hidden

  const symbol = d.symbol === 'none' ? null : d.symbol === 'candle' ? <Candle /> : d.symbol

  return (
    <div
      className={`sheet layout-${d.layout}${d.customPaper ? ' custom-paper' : ''}${picked === 'page' ? ' picked-page' : ''}`}
      style={{
        '--accent': d.accent,
        '--paper': d.paper,
        '--ink': d.ink,
        '--head': `'${d.headFont}'`,
        '--text': `'${d.bodyFont}'`,
      }}
      onClick={pick('page')}
    >
      <div className={`page-frame pgf-${d.pageFrame}`} aria-hidden />
      {d.decor === 'corners' && <Corners />}
      {d.decor === 'ribbon' && <div className="corner-ribbon" aria-hidden />}
      {d.decor === 'band' && <div className="band" aria-hidden />}
      {d.decor === 'flowers' && (
        <>
          <Branch className="branch tl" />
          <Branch className="branch br" />
        </>
      )}

      <div className="sheet-inner">
        {T('cross', 'div', 'cross', symbol)}
        {T('heading', 'h1', 'heading', t.heading)}
        {T('sub', 'div', 'sub', sub)}

        <div className="main">
          {showPhoto && (
            <div
              data-field="photo"
              className={cls('photo', `photo-wrap pfr-${d.photoFrame}`)}
              style={{ width: pw, height: ph }}
              onClick={pick('photo')}
            >
              {d.decor === 'wreath' && <Wreath />}
              <div className={`ph ph-a shape-${d.photoShape}`}>
                <div className="ph ph-b">
                  <div className="ph ph-c">
                    {photoSrc ? <img className={f.grayscale ? 'gray' : ''} src={photoSrc} alt="" /> : <PhotoPlaceholder />}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="text">
            {T('name', 'div', 'name', f.name.trim() || 'Име Презиме Фамилия')}
            {T('years', 'div', 'years', span)}
            {T('body', 'p', 'body', body)}
            {T('event', 'p', 'event', event)}
            {T('closing', 'p', 'closing', f.closing)}
          </div>
        </div>

        {T('family', 'div', 'family', f.family)}
      </div>
    </div>
  )
}
