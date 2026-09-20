// Orbes planetarios por semisuma. AGPL-3.0-only.
export const traditionalPlanets = ['Sol', 'Luna', 'Mercurio', 'Venus', 'Marte', 'Júpiter', 'Saturno'];
export const medievalOrbs = Object.freeze({ Sol: 15, Luna: 12, Saturno: 9, 'Júpiter': 9, Marte: 8, Venus: 7, Mercurio: 7 });
export const aspectDefinitions = [{ name: 'Conjunción', angle: 0 }, { name: 'Sextil', angle: 60 }, { name: 'Cuadratura', angle: 90 }, { name: 'Trígono', angle: 120 }, { name: 'Oposición', angle: 180 }];
export function resetOrbs() { return { ...medievalOrbs }; }
export function separation(a, b) { const d = ((a - b) % 360 + 360) % 360; return Math.min(d, 360 - d); }
export function moiety(a, b, orbs = resetOrbs()) {
    if (!traditionalPlanets.includes(a) || !traditionalPlanets.includes(b))
        throw Error('Solo planetas tradicionales.');
    for (const p of [a, b])
        if (!Number.isFinite(orbs[p]) || orbs[p] < 0 || orbs[p] > 30)
            throw Error('Cada orbe planetario debe estar entre 0° y 30°.');
    return (orbs[a] + orbs[b]) / 2;
}
export function evaluateAspects(bodies, orbs = resetOrbs()) {
    const planets = bodies.filter(b => traditionalPlanets.includes(b.name));
    const result = [];
    for (let i = 0; i < planets.length; i++)
        for (let j = i + 1; j < planets.length; j++) {
            const a = planets[i], b = planets[j], limit = moiety(a.name, b.name, orbs), distance = separation(a.longitude, b.longitude);
            for (const def of aspectDefinitions) {
                const orb = Math.abs(distance - def.angle);
                result.push({ from: a.name, to: b.name, name: def.name, angle: def.angle, separation: distance, orb, limit, active: orb <= limit + 1e-10 });
            }
        }
    return result;
}
export function calculateAspects(bodies, orbs = resetOrbs()) { return evaluateAspects(bodies, orbs).filter(a => a.active); }
