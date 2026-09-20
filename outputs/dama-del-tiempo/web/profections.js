import { normalizeLongitude, rulerships, evaluateDignities } from './dignities.js';
import { zodiacPosition } from './lots.js';
import { compactAspects } from './aspect-ui.js';
export const method = 'Profección anual por signos enteros';
export const sourceLabel = 'Regla solicitada: edad cumplida módulo 12; regencias tradicionales del módulo de dignidades.';
const leap = (y) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
export function civilDate(text) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text); if (!m)
    throw Error('Usá una fecha civil válida.'); const [y, mo, d] = m.slice(1).map(Number), days = [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; if (y < 1 || y > 9999 || mo < 1 || mo > 12 || d < 1 || d > days[mo - 1])
    throw Error('Fecha civil fuera del calendario gregoriano.'); return { y, mo, d }; }
export function anniversary(birth, year, policy = 'feb28') { const b = civilDate(birth); if (!Number.isInteger(year) || year < 1 || year > 9999)
    throw Error('El aniversario excede el calendario admitido.'); let mo = b.mo, d = b.d; if (mo === 2 && d === 29 && !leap(year)) {
    mo = policy === 'mar1' ? 3 : 2;
    d = policy === 'mar1' ? 1 : 28;
} return `${String(year).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
export function ageAt(birth, target, policy = 'feb28') { const b = civilDate(birth), t = civilDate(target); if (target < birth)
    throw Error('La fecha objetivo es anterior al nacimiento.'); return t.y - b.y - (target < anniversary(birth, t.y, policy) ? 1 : 0); }
export function activation(asc, age) { if (!Number.isSafeInteger(age) || age < 0)
    throw Error('La edad debe ser un número entero no negativo.'); const cycleIndex = age % 12, index = (Math.floor(normalizeLongitude(asc) / 30) + cycleIndex) % 12, sign = rulerships.intervals[index]; return { age, cycleIndex, activatedHouse: cycleIndex + 1, activatedSign: sign.sign, activatedSignIndex: index, lordOfYear: sign.domicile }; }
export function profectPoint(point, age) { const a = activation(point.longitude, age), longitude = normalizeLongitude(point.longitude + (age % 12) * 30); return { ...point, natalLongitude: point.longitude, natalPosition: zodiacPosition(point.longitude), longitude, position: zodiacPosition(longitude), activatedSign: a.activatedSign, label: 'Posición profectada por signo' }; }
export function annualProfection(natal, query) { const policy = query.policy || 'feb28', age = query.age !== undefined ? query.age : ageAt(natal.birthDate, query.date || '', policy), a = activation(natal.asc, age), year = civilDate(natal.birthDate).y + age, body = natal.bodies.find(b => b.name === a.lordOfYear); if (!body)
    throw Error('Falta la posición natal del señor del año.'); const points = [{ id: 'asc', name: 'Ascendente', longitude: natal.asc }, ...natal.points]; return { ...a, periodStart: anniversary(natal.birthDate, year, policy), periodEnd: anniversary(natal.birthDate, year + 1, policy), query: { ...query }, leapPolicy: policy, method, sourceLabel, natal: { birthDate: natal.birthDate, asc: natal.asc, houseSystem: natal.houseSystem }, profectedPoints: points.filter(p => p.id === 'asc' || query.selected?.includes(p.id)).map(p => profectPoint(p, age)), natalLordCondition: { ...body, position: zodiacPosition(body.longitude), sect: natal.sect, dignities: evaluateDignities(body.name, body.longitude, natal.sect), aspects: compactAspects(natal.aspects, natal.bodies).filter(r => r.aspect.from === body.name || r.aspect.to === body.name).map(r => r.values), ruledWholeSignHouses: rulerships.intervals.flatMap((_, i) => rulerships.intervals[(Math.floor(normalizeLongitude(natal.asc) / 30) + i) % 12].domicile === body.name ? [i + 1] : []), ruledVisibleHouses: natal.cusps.filter(c => rulerships.intervals[Math.floor(normalizeLongitude(c.longitude) / 30)].domicile === body.name).map(c => c.house) } }; }
