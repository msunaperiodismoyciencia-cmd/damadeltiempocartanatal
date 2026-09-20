import { angularSeconds, aspectMovement } from './angular.js';
const symbols = { Conjunción: '☌', Sextil: '⚹', Cuadratura: '□', Trígono: '△', Oposición: '☍' };
export const compactHeaders = ['Primer cuerpo', 'Aspecto', 'Segundo cuerpo', 'Orbe', 'Movimiento'];
export const movementLabel = (movement) => movement === 'Aplicante' ? 'Aplicativo' : movement;
export function compactAspects(aspects, bodies, order = 'planet') {
    return aspects.filter(a => a.active).map(aspect => {
        const a = bodies.find(b => b.name === aspect.from), b = bodies.find(b => b.name === aspect.to);
        const movement = a && b ? movementLabel(aspectMovement(a, b, aspect.angle)) : 'Indeterminado';
        return { aspect, values: [aspect.from, `${symbols[aspect.name] ?? ''} ${aspect.name}`.trim(), aspect.to, angularSeconds(aspect.orb), movement] };
    }).sort((a, b) => (order === 'orb' ? a.aspect.orb - b.aspect.orb : 0) || a.aspect.from.localeCompare(b.aspect.from, 'es') || a.aspect.to.localeCompare(b.aspect.to, 'es') || a.aspect.angle - b.aspect.angle);
}
export function compactCsv(rows) { return '\uFEFF' + [compactHeaders, ...rows.map(r => r.values)].map(values => values.map(v => '"' + v.replaceAll('"', '""') + '"').join(';')).join('\r\n') + '\r\n'; }
export function renderAspectTable(aspects, bodies) {
    const table = document.getElementById('aspect-list'), order = document.getElementById('aspect-order').value;
    table.replaceChildren();
    for (const { aspect, values } of compactAspects(aspects, bodies, order)) {
        const row = document.createElement('tr');
        row.dataset.from = aspect.from;
        row.dataset.to = aspect.to;
        row.dataset.aspect = aspect.name;
        values.forEach(text => { const cell = document.createElement('td'); cell.textContent = text; row.append(cell); });
        table.append(row);
    }
    document.getElementById('aspect-empty').hidden = table.childElementCount > 0;
}
