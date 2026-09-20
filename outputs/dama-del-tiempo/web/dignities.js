// Cálculo independiente de dignidades; datos históricos fuera de la interfaz.
import rulerships from './data/rulerships.json' with { type: 'json' };
import triplicities from './data/triplicities.json' with { type: 'json' };
import terms from './data/egyptian-terms.json' with { type: 'json' };
import faces from './data/faces.json' with { type: 'json' };
export { rulerships, triplicities, terms, faces };
export const dignitySystem = 'Dignidades tradicionales — términos egipcios';
export const normalizeLongitude = (longitude) => { if (!Number.isFinite(longitude))
    throw Error('Longitud no finita.'); return ((longitude % 360) + 360) % 360; };
export function intervalAt(segments, degree) { const interval = segments.find(s => degree >= s.start && degree < s.end); if (!interval)
    throw Error('Posición fuera de los intervalos.'); return interval; }
export function positionRules(longitude, sect) {
    if (sect !== 'diurna' && sect !== 'nocturna')
        throw Error('Falta la secta calculada respecto del horizonte.');
    const lon = normalizeLongitude(longitude), index = Math.floor(lon / 30), degree = lon - index * 30, sign = rulerships.intervals[index];
    const triplicity = triplicities.intervals.find(t => t.element === sign.element);
    return { longitude: lon, index, degree, sign, triplicity, principal: sect === 'diurna' ? triplicity.day : triplicity.night, term: intervalAt(terms.intervals[index].segments, degree), face: intervalAt(faces.intervals[index].segments, degree) };
}
export function evaluateDignities(planet, longitude, sect) {
    if (!['Sol', 'Luna', 'Mercurio', 'Venus', 'Marte', 'Júpiter', 'Saturno'].includes(planet))
        throw Error('Solo los siete planetas tradicionales tienen dignidades en este módulo.');
    const rules = positionRules(longitude, sect);
    const { sign, term, face, principal } = rules;
    const definitions = [
        { name: 'Domicilio', ruler: sign.domicile, positive: true, points: 5, data: rulerships, rule: `Todo el signo de ${sign.sign}.` },
        { name: 'Exaltación', ruler: sign.exaltation?.planet, positive: true, points: 4, data: rulerships, rule: `Todo el signo; grado tradicional ${sign.exaltation?.degree ?? '—'}°, solo como referencia.` },
        { name: 'Triplicidad activa', ruler: principal, positive: true, points: 3, data: triplicities, rule: `${sign.element}, carta ${sect}; principal ${principal}. El participante se informa separadamente.` },
        { name: 'Término', ruler: term.ruler, positive: true, points: 2, data: terms, rule: `${term.start}° ≤ grado < ${term.end}° en ${sign.sign}.` },
        { name: 'Face', ruler: face.ruler, positive: true, points: 1, data: faces, rule: `${face.start}° ≤ grado < ${face.end}° en ${sign.sign}.` },
        { name: 'Detrimento', ruler: sign.detriment, positive: false, points: -5, data: rulerships, rule: `Todo el signo de ${sign.sign}.` },
        { name: 'Caída', ruler: sign.fall?.planet, positive: false, points: -4, data: rulerships, rule: `Todo el signo; grado tradicional de caída ${sign.fall?.degree ?? '—'}°, no es requisito.` }
    ];
    const testimonies = definitions.map(d => ({ planet, longitude: rules.longitude, sign: sign.sign, dignity: d.name, ruler: d.ruler ?? null, found: planet === d.ruler, positive: d.positive, points: planet === d.ruler ? d.points : 0, termsSystem: terms.system, sect, source: d.data.source, reference: d.data.reference, version: d.data.version, explanation: `${d.rule} ${planet === d.ruler ? 'El planeta posee este testimonio.' : 'No corresponde a este planeta.'}` }));
    const peregrine = !testimonies.some(t => t.found && t.positive);
    return { planet, ...rules, sect, system: dignitySystem, testimonies, peregrine, score: testimonies.reduce((sum, t) => sum + t.points, 0), participant: rules.triplicity.participant, participantIsPlanet: planet === rules.triplicity.participant, peregrinityExplanation: peregrine ? 'Sin domicilio, exaltación, triplicidad principal activa, término ni face propios.' : 'Posee al menos una dignidad esencial positiva; detrimento o caída no la anulan.' };
}
export function referenceRows() { return rulerships.intervals.map((s, i) => ({ ...s, triplicity: triplicities.intervals.find(t => t.element === s.element), terms: terms.intervals[i].segments, faces: faces.intervals[i].segments })); }
