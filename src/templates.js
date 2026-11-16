import { formatBg } from './dates'

export const TYPES = [
  { id: 'death', label: 'Тъжна вест', heading: 'ТЪЖНА ВЕСТ', sub: '' },
  { id: 'd40', label: '40 дни', heading: 'ПОМЕН', sub: '40 дни без теб' },
  { id: 'm6', label: '6 месеца', heading: 'ПОМЕН', sub: '6 месеца без теб' },
  { id: 'y1', label: '1 година', heading: 'ПОМЕН', sub: '1 година без теб' },
  { id: 'yearly', label: 'Възпоменание', heading: 'ВЪЗПОМЕНАНИЕ', sub: '' },
]

export const CLOSINGS = [
  'Почивай в мир!',
  'Бог да те прости!',
  'Поклон пред светлата ти памет!',
  'Вечна ти памет!',
  'Ще те помним винаги!',
]

export function subFor(type, years) {
  if (type === 'yearly') return `${years} ${Number(years) === 1 ? 'година' : 'години'} без теб`
  return TYPES.find((t) => t.id === type)?.sub ?? ''
}

const g = (f, m, w) => (f.gender === 'f' ? w : m)

function who(f) {
  const rel = f.relation.trim()
  return rel ? `${g(f, 'нашият скъп', 'нашата скъпа')} ${rel}` : 'един скъп за всички нас човек'
}

const BODIES = {
  death: [
    (f, on) => `С дълбока скръб съобщаваме, че ${on}ни напусна ${who(f)}.`,
    (f, on) => `${cap(on)}си отиде ${who(f)}. Остави след себе си доброта и обич, които никога няма да забравим.`,
    (f, on) =>
      `${cap(on)}след достоен живот почина ${who(f)}. ${g(f, 'Ще те помним винаги усмихнат, грижовен и добър.', 'Ще те помним винаги усмихната, грижовна и добра.')}`,
  ],
  d40: [
    () => 'Изминаха 40 дни, откакто не си сред нас. Болката не стихва, а споменът за теб е жив всеки ден.',
    () => 'Четиридесет дни без твоя глас и твоята усмивка. Обичаме те и те помним.',
  ],
  m6: [
    () => 'Шест месеца без твоята топлина и грижа. Липсваш ни повече, отколкото думите могат да кажат.',
    () => 'Половин година мина, а ти все още си с нас във всяка мисъл. Винаги в сърцата ни.',
  ],
  y1: [
    () => 'Една година без теб. Времето минава, но обичта и споменът остават.',
    () => 'Измина цяла година, откакто ни напусна. Всеки ден ни липсваш.',
  ],
  yearly: [
    () => 'Тъгата не минава, обичта не угасва. Помним те и те обичаме.',
    () => 'Времето не лекува, само ни учи да живеем без теб. Завинаги в сърцата ни.',
  ],
}

function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : ''
}

export function variantCount(type) {
  return BODIES[type].length
}

export function buildBody(f, variant) {
  const list = BODIES[f.type]
  const on = f.death ? `на ${formatBg(f.death)} ` : ''
  return list[variant % list.length](f, on)
}

export function buildEvent(f) {
  const parts = []
  if (f.eventDate) parts.push(`на ${formatBg(f.eventDate)}`)
  if (f.eventTime) parts.push(`от ${f.eventTime} ч.`)
  if (f.eventPlace.trim()) parts.push(`в ${f.eventPlace.trim()}`)
  if (!parts.length) return ''
  const lead = f.type === 'death' ? 'Поклонението ще се състои' : 'Помен ще бъде отслужен'
  return `${lead} ${parts.join(' ')}.`
}
