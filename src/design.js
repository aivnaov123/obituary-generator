// Design system: templates (layouts), shapes, frames, fonts and per-field styling.

const F = {
  corm: 'Cormorant Garamond',
  noto: 'Noto Serif',
  pt: 'PT Serif',
  lora: 'Lora',
  play: 'Playfair Display',
  mont: 'Montserrat',
  inter: 'Inter',
  osw: 'Oswald',
  marck: 'Marck Script',
  phil: 'Philosopher',
}

export const FONTS = [
  { name: F.corm, label: 'Cormorant (класически)' },
  { name: F.play, label: 'Playfair (елегантен)' },
  { name: F.pt, label: 'PT Serif' },
  { name: F.noto, label: 'Noto Serif' },
  { name: F.lora, label: 'Lora' },
  { name: F.phil, label: 'Philosopher' },
  { name: F.mont, label: 'Montserrat (модерен)' },
  { name: F.inter, label: 'Inter' },
  { name: F.osw, label: 'Oswald (сбит)' },
  { name: F.marck, label: 'Marck Script (ръкописен)' },
]

/**
 * Each template = default values for every design option.
 * The user can override any of them; overrides win.
 */
export const LAYOUTS = [
  { id: 'classic', label: 'Класически', d: { pageFrame: 'thick', photoShape: 'rect', photoFrame: 'thick', accent: '#111111', paper: '#ffffff', ink: '#111111', symbol: '✝', headFont: F.corm, bodyFont: F.noto } },
  { id: 'orthodox', label: 'Православен', decor: 'corners', d: { pageFrame: 'double', photoShape: 'arch', photoFrame: 'double', accent: '#a8843f', paper: '#fbf7ee', ink: '#2e2312', symbol: '☦', headFont: F.corm, bodyFont: F.pt } },
  { id: 'ribbon', label: 'Траурна лента', decor: 'ribbon', d: { pageFrame: 'thin', photoShape: 'rect', photoFrame: 'double', accent: '#111111', paper: '#ffffff', ink: '#111111', symbol: 'none', headFont: F.play, bodyFont: F.lora } },
  { id: 'modern', label: 'Модерен', decor: 'band', d: { pageFrame: 'none', photoShape: 'rect', photoFrame: 'none', accent: '#111111', paper: '#ffffff', ink: '#151515', symbol: 'none', headFont: F.mont, bodyFont: F.inter, photoW: 270, photoH: 360 } },
  { id: 'minimal', label: 'Минимален', d: { pageFrame: 'none', photoShape: 'circle', photoFrame: 'none', accent: '#111111', paper: '#ffffff', ink: '#111111', symbol: '✟', headFont: F.corm, bodyFont: F.lora } },
  { id: 'floral', label: 'Цветя', decor: 'flowers', d: { pageFrame: 'none', photoShape: 'oval', photoFrame: 'mat', accent: '#7b6a5d', paper: '#f6f2ed', ink: '#3a312a', symbol: '✝', headFont: F.corm, bodyFont: F.lora } },
  { id: 'marble', label: 'Мрамор', decor: 'marble', d: { pageFrame: 'double', photoShape: 'rounded', photoFrame: 'thin', accent: '#b08d57', paper: '#f7f5f2', ink: '#2b2b2b', symbol: '✝', headFont: F.play, bodyFont: F.pt } },
  { id: 'dark', label: 'Тъмен', d: { pageFrame: 'thin', photoShape: 'arch', photoFrame: 'thin', accent: '#c9c3b6', paper: '#151515', ink: '#f1eee8', symbol: '✝', headFont: F.corm, bodyFont: F.noto } },
  { id: 'candle', label: 'Свещ', d: { pageFrame: 'rounded', photoShape: 'rounded', photoFrame: 'shadow', accent: '#b9853f', paper: '#fffaf1', ink: '#2f2417', symbol: 'candle', headFont: F.phil, bodyFont: F.pt } },
  { id: 'olive', label: 'Маслинова клонка', decor: 'wreath', d: { pageFrame: 'none', photoShape: 'circle', photoFrame: 'thin', accent: '#6b7b4b', paper: '#fafaf4', ink: '#2c3020', symbol: 'none', headFont: F.corm, bodyFont: F.lora } },
  { id: 'arch', label: 'Арка', d: { pageFrame: 'arch', photoShape: 'arch', photoFrame: 'mat', accent: '#5f7468', paper: '#f2f4f0', ink: '#24302a', symbol: '✟', headFont: F.play, bodyFont: F.lora } },
  { id: 'editorial', label: 'Вестник', decor: 'rules', d: { pageFrame: 'none', photoShape: 'rect', photoFrame: 'none', accent: '#111111', paper: '#fdfdfb', ink: '#111111', symbol: 'none', headFont: F.osw, bodyFont: F.pt } },
]

export const PAGE_FRAMES = [
  { id: 'none', label: 'Без' },
  { id: 'thin', label: 'Тънка' },
  { id: 'thick', label: 'Дебела' },
  { id: 'double', label: 'Двойна' },
  { id: 'rounded', label: 'Заоблена' },
  { id: 'arch', label: 'Арка' },
  { id: 'corners', label: 'Ъгли' },
]

export const PHOTO_SHAPES = [
  { id: 'rect', label: 'Правоъгълна' },
  { id: 'rounded', label: 'Заоблена' },
  { id: 'oval', label: 'Овал' },
  { id: 'circle', label: 'Кръг' },
  { id: 'arch', label: 'Арка' },
]

export const PHOTO_FRAMES = [
  { id: 'none', label: 'Без' },
  { id: 'thin', label: 'Тънка' },
  { id: 'thick', label: 'Дебела' },
  { id: 'double', label: 'Двойна' },
  { id: 'mat', label: 'Паспарту' },
  { id: 'shadow', label: 'Сянка' },
]

export const SYMBOLS = [
  { id: '✝', label: '✝' },
  { id: '☦', label: '☦' },
  { id: '✟', label: '✟' },
  { id: 'candle', label: '🕯' },
  { id: 'none', label: 'Без' },
]

export const ACCENTS = ['#111111', '#a8843f', '#b9853f', '#6b7b4b', '#5f7468', '#7b6a5d', '#7a2e2e', '#2f4a6d']
export const PAPERS = ['#ffffff', '#fbf7ee', '#f6f2ed', '#f2f4f0', '#eef1f5', '#151515']

export const TEXT_FIELDS = [
  { id: 'cross', label: 'Символ' },
  { id: 'heading', label: 'Заглавие' },
  { id: 'sub', label: 'Подзаглавие' },
  { id: 'name', label: 'Име' },
  { id: 'years', label: 'Години' },
  { id: 'body', label: 'Текст' },
  { id: 'event', label: 'Помен / поклонение' },
  { id: 'closing', label: 'Завършек' },
  { id: 'family', label: 'Подпис' },
]

export const ELEMENTS = [{ id: 'page', label: 'Страница' }, { id: 'photo', label: 'Снимка' }, ...TEXT_FIELDS]

/** Inline style for a text field from the user's overrides. Unset = template default. */
export function fieldStyle(s) {
  if (!s) return undefined
  const o = {}
  if (s.font) o.fontFamily = `'${s.font}', serif`
  if (s.color) o.color = s.color
  if (s.scale && s.scale !== 100) o['--k'] = s.scale / 100
  if (s.bold != null) o.fontWeight = s.bold ? 700 : 400
  if (s.italic != null) o.fontStyle = s.italic ? 'italic' : 'normal'
  if (s.upper != null) o.textTransform = s.upper ? 'uppercase' : 'none'
  if (s.spacing != null) o.letterSpacing = `${s.spacing}em`
  if (s.align) {
    o.textAlign = s.align
    o.alignSelf = { left: 'flex-start', center: 'center', right: 'flex-end' }[s.align]
    if (s.align === 'left') o.marginLeft = 0
    if (s.align === 'right') o.marginRight = 0
  }
  return o
}

/** Merge template defaults with user overrides into one effective design. */
export function resolveDesign(layoutId, overrides = {}, photoSize = 100, fields = {}) {
  const L = LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[0]
  const clean = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v != null))
  return { ...L.d, ...clean, layout: L.id, decor: L.decor, photoSize, fields, customPaper: !!clean.paper }
}
