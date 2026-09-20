import { initProfections } from './profections-ui.js';
import { appendProfection } from './profections-wheel.js';
import { catalog as lotCatalog } from './lots.js';
import { renderAspectTable, compactAspects, compactCsv } from './aspect-ui.js';
import { initLots } from './lots-ui.js';
import { appendLots } from './lots-wheel.js';
import { renderReference, renderChartDignities, applyScoreVisibility } from './dignities-ui.js';
// Dama del Tiempo · AGPL-3.0-only. Presentación; no calcula posiciones.
import { renderWheel, defaultOptions, downloadSvg, downloadBlob, pngBlob, termLabel } from './wheel.js';
import { evaluateAspects, resetOrbs, medievalOrbs, traditionalPlanets } from './aspects.js';
const el = (id) => document.getElementById(id);
const value = (id) => el(id).value;
const set = (id, v) => { el(id).value = v; };
const form = el('chart-form');
let revision = 0;
let searchVersion = 0;
let currentResult = null;
let currentSvg = '';
const wheelOptions = { ...defaultOptions };
let orbs = resetOrbs();
const profections = initProfections(el('profections-section'), updateWheel);
const lots = initLots(el('lots-section'), updateWheel);
api('/api/house-systems').then(registry => {
    const select = el('house-system');
    select.replaceChildren();
    for (const system of registry.systems) {
        const option = document.createElement('option');
        option.value = system.id;
        option.textContent = system.name;
        select.append(option);
    }
    select.value = registry.default;
    select.disabled = false;
    el('calculate').disabled = false;
}).catch(() => { el('error').textContent = 'No se pudo cargar el catálogo de sistemas de casas. Reiniciá el servidor actualizado y recargá la página.'; el('error').hidden = false; });
el('house-system').addEventListener('change', async () => {
    if (!currentResult) {
        revision++;
        el('status').textContent = 'Sistema elegido. Calculá la carta con los datos del formulario.';
        return;
    }
    const previous = currentResult, name = el('chart-name').textContent || '', current = ++revision;
    lots.clearChart();
    profections.setNatal(null);
    currentSvg = '';
    el('results').hidden = true;
    el('error').hidden = true;
    el('empty').hidden = true;
    el('status').textContent = 'Actualizando casas; se conservan las posiciones planetarias…';
    try {
        const updated = await api('/api/houses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chart: previous, house_system: value('house-system') }) });
        if (current !== revision)
            return;
        render(updated, name);
        el('status').textContent = 'Casas y rueda actualizadas. Posiciones planetarias conservadas.';
    }
    catch (error) {
        if (current !== revision)
            return;
        el('error').textContent = error.message;
        el('error').hidden = false;
        el('status').textContent = 'No hay resultados válidos para el sistema solicitado. Seleccioná otro sistema.';
    }
});
function invalidate() { revision++; currentResult = null; currentSvg = ''; lots.clearChart(); profections.setNatal(null); el('results').hidden = true; el('empty').hidden = false; el('error').hidden = true; el('status').textContent = 'Datos modificados. Calculá para obtener resultados actualizados.'; }
form.addEventListener('input', invalidate);
let searchTimer;
el('place').addEventListener('input', () => { searchVersion++; clearTimeout(searchTimer); el('place-results').replaceChildren(); set('latitude', ''); set('longitude', ''); set('timezone', ''); el('place-status').textContent = value('place').trim().length < 2 ? 'Escribí al menos dos letras de la ciudad.' : 'Buscando localidades…'; if (value('place').trim().length >= 2)
    searchTimer = setTimeout(searchPlaces, 500); });
el('place').addEventListener('keydown', event => { if (event.key === 'Enter') {
    event.preventDefault();
    searchPlaces();
} });
async function api(url, init) { const response = await fetch(url, init); const data = await response.json(); if (!response.ok)
    throw Error(data.error || 'No se pudo completar la solicitud.'); return data; }
el('search').addEventListener('click', searchPlaces);
async function searchPlaces() {
    clearTimeout(searchTimer);
    if (value('place').trim().length < 2) {
        el('place-status').textContent = 'Escribí al menos dos letras de la ciudad.';
        return;
    }
    const version = ++searchVersion;
    el('place-results').replaceChildren();
    el('place-status').textContent = 'Buscando localidades…';
    try {
        const data = await api('/api/places?q=' + encodeURIComponent(value('place')));
        if (version !== searchVersion)
            return;
        el('place-status').textContent = data.results.length ? 'Elegí la localidad correcta.' : 'No se encontraron localidades. Probá con ciudad y país o ingresá los datos manualmente.';
        for (const place of data.results) {
            if (!place.timezone)
                continue;
            const b = document.createElement('button');
            b.type = 'button';
            const label = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
            b.textContent = label;
            b.addEventListener('click', () => { set('place', label); set('latitude', String(place.latitude)); set('longitude', String(place.longitude)); set('timezone', place.timezone); el('place-results').replaceChildren(); el('place-status').textContent = 'Localidad seleccionada. Coordenadas del centro urbano; podés ajustarlas.'; invalidate(); });
            el('place-results').append(b);
        }
    }
    catch (error) {
        if (version === searchVersion)
            el('place-status').textContent = error.message;
    }
}
el('sample').addEventListener('click', () => { searchVersion++; clearTimeout(searchTimer); set('name', 'Ejemplo · Greenwich'); set('date', '2000-01-01'); set('time', '12:00:00'); set('place', 'Greenwich, Reino Unido · punto de referencia'); set('latitude', '51.4779'); set('longitude', '0'); set('timezone', 'Etc/UTC'); set('fold', ''); set('node', 'mean'); set('threshold', '0.001'); el('place-results').replaceChildren(); el('place-status').textContent = 'Ejemplo de comprobación: 1 de enero de 2000, 12:00 UTC.'; invalidate(); });
function row(target, values, retro = false) { const tr = document.createElement('tr'); values.forEach((v, i) => { const cell = document.createElement('td'); cell.textContent = String(v); if (retro && i === 5)
    cell.className = 'retro'; tr.append(cell); }); el(target).append(tr); }
function render(data, name) {
    el('bodies').replaceChildren();
    el('cusps').replaceChildren();
    el('angles').replaceChildren();
    el('chart-name').textContent = name.trim() || 'Carta sin nombre';
    currentResult = data;
    set('house-system', data.results.house_system.id);
    el('active-system').textContent = `Sistema activo: ${data.results.house_system.name}`;
    el('house-column').textContent = `Casa · ${data.results.house_system.name}`;
    el('time-summary').textContent = `Hora local: ${data.time.local.replace('T', ' ')}\nUTC: ${data.time.utc.replace('T', ' ')} · ${data.time.zone}`;
    el('warning').textContent = data.warnings.join(' ');
    el('warning').hidden = !data.warnings.length;
    for (const angle of data.results.angles) {
        const box = document.createElement('div');
        box.className = 'angle';
        const label = document.createElement('small');
        label.textContent = angle.name;
        const p = document.createElement('strong');
        p.textContent = angle.position;
        box.append(label, p);
        el('angles').append(box);
    }
    for (const b of data.results.bodies)
        row('bodies', [b.name, b.position, b.house, b.whole_sign, b.speed.toFixed(6), b.motion], b.motion === 'Retrógrado');
    for (const c of data.results.cusps)
        row('cusps', [c.house, c.sign, `${c.degree}°`, `${String(c.minute).padStart(2, '0')}′`, `${c.longitude.toFixed(6)}°`, data.results.house_system.name, c.whole_sign]);
    el('technical').textContent = `Swiss Ephemeris ${data.astronomy.engine}\nEfemérides: sepl_18.se1 / semo_18.se1\nCalendario gregoriano · posiciones aparentes tropicales y geocéntricas\nDía juliano TT: ${data.astronomy.jd_tt}\nDía juliano UT1: ${data.astronomy.jd_ut1}\nIANA tzdata: ${data.time.tzdata}\nDesfase respecto de UTC: ${data.time.offset_seconds} segundos\nComponente de horario de verano: ${data.time.dst_seconds} segundos\nNodo: ${data.astronomy.node === 'mean' ? 'medio' : 'verdadero'}\nUmbral estacionario: ${data.results.station_threshold} °/día\nNodo Sur: opuesto al Nodo Norte. Casas por longitud eclíptica.\nNo se aplican interpretaciones ni regla de los 5°.`;
    renderChartDignities(data.results.bodies, data.sect);
    el('empty').hidden = true;
    el('results').hidden = false;
    lots.setChart(data);
    updateWheel();
}
function updateWheel() {
    if (!currentResult)
        return;
    const invalid = Array.from(el('orb-inputs').querySelectorAll('input')).some(input => !input.checkValidity());
    el('download-svg').disabled = invalid;
    el('download-png').disabled = invalid;
    if (invalid) {
        currentSvg = '';
        el('wheel').replaceChildren();
        el('aspect-list').replaceChildren();
        el('wheel-message').textContent = 'Revisá los orbes: deben ser números entre 0° y 30°, sin dejarlos vacíos. No se exportan resultados con orbes inválidos.';
        return;
    }
    const evaluated = evaluateAspects(currentResult.results.bodies, orbs);
    const aspects = evaluated.filter(a => a.active);
    const asc = currentResult.results.angles.find(a => a.name === 'Ascendente').longitude;
    profections.setNatal({ birthDate: currentResult.time.local.slice(0, 10), asc, sect: currentResult.sect.name, houseSystem: currentResult.results.house_system.name, cusps: currentResult.results.cusps, aspects, bodies: currentResult.results.bodies.filter(b => traditionalPlanets.includes(b.name)).map(b => ({ ...b, id: b.name })), points: [...currentResult.results.bodies.filter(b => traditionalPlanets.includes(b.name)).map(b => ({ id: b.name, name: b.name, longitude: b.longitude })), ...currentResult.results.angles.filter(a => a.name === 'Medio Cielo').map(a => ({ ...a, id: 'mc' })), ...lots.calculated().filter(l => l.ok && l.longitude !== undefined).map(l => ({ id: l.id, name: lotCatalog.find(c => c.id === l.id)?.nameSpanish || l.id, longitude: l.longitude }))] });
    currentSvg = renderWheel(currentResult.results, wheelOptions, aspects, el('chart-name').textContent || 'Dama del Tiempo');
    currentSvg = appendLots(currentSvg, lots.visible(), currentResult.results.angles.find(a => a.name === 'Ascendente').longitude, wheelOptions.print);
    currentSvg = appendProfection(currentSvg, profections.layer(), asc, wheelOptions.print);
    el('wheel').innerHTML = currentSvg;
    el('planet-orbs').textContent = traditionalPlanets.map(p => `${p}: ${orbs[p]}°`).join(' · ');
    const custom = traditionalPlanets.some(p => orbs[p] !== medievalOrbs[p]);
    el('orb-summary').textContent = `${custom ? 'Orbes planetarios personalizados por semisuma' : 'Orbes planetarios medievales por semisuma'} · ${aspects.length} aspectos dentro de orbe.`;
    el('aspect-list').replaceChildren();
    renderAspectTable(aspects, currentResult.results.bodies);
    el('wheel-message').textContent = '';
}
for (const planet of traditionalPlanets) {
    const label = document.createElement('label'), input = document.createElement('input');
    label.textContent = planet;
    input.type = 'number';
    input.min = '0';
    input.max = '30';
    input.step = 'any';
    input.required = true;
    input.value = String(orbs[planet]);
    input.dataset.planet = planet;
    input.setAttribute('aria-label', `Orbe ${planet} en grados`);
    input.addEventListener('input', () => { if (input.checkValidity())
        orbs[planet] = Number(input.value); updateWheel(); });
    label.append(input);
    el('orb-inputs').append(label);
}
el('reset-orbs').addEventListener('click', () => { orbs = resetOrbs(); for (const input of Array.from(el('orb-inputs').querySelectorAll('input')))
    input.value = String(orbs[input.dataset.planet]); updateWheel(); });
for (const [id, key] of [['show-terms', 'terms'], ['show-aspects', 'aspects'], ['show-degrees', 'degrees'], ['show-cusps', 'cusps']]) {
    el(id).addEventListener('change', () => { wheelOptions[key] = el(id).checked; updateWheel(); });
}
el('wheel-mode').addEventListener('change', () => { wheelOptions.print = value('wheel-mode') === 'print'; updateWheel(); });
el('wheel-zoom').addEventListener('change', () => { el('wheel').className = `wheel-zoom-${value('wheel-zoom')}`; });
el('download-svg').addEventListener('click', () => { if (currentSvg) {
    downloadSvg(currentSvg);
    el('wheel-message').textContent = 'SVG preparado con los glifos convertidos a trazados.';
} });
el('download-png').addEventListener('click', async () => {
    if (!currentSvg)
        return;
    const button = el('download-png');
    button.disabled = true;
    const snapshot = currentSvg;
    try {
        downloadBlob(await pngBlob(snapshot), 'dama-del-tiempo-3300.png');
        el('wheel-message').textContent = 'PNG de 3300 × 3300 píxeles preparado.';
    }
    catch (error) {
        el('wheel-message').textContent = error.message;
    }
    finally {
        button.disabled = false;
    }
});
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const current = ++revision;
    currentResult = null;
    currentSvg = '';
    lots.clearChart();
    profections.setNatal(null);
    const name = value('name');
    const button = el('calculate');
    button.disabled = true;
    el('error').hidden = true;
    el('results').hidden = true;
    el('status').textContent = 'Calculando con Swiss Ephemeris…';
    try {
        const result = await api('/api/chart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: value('date'), time: value('time'), latitude: Number(value('latitude')), longitude: Number(value('longitude')), timezone: value('timezone').trim(), fold: value('fold') === '' ? null : Number(value('fold')), node: value('node'), station_threshold: Number(value('threshold')), house_system: value('house-system') }) });
        if (current !== revision)
            return;
        render(result, name);
        el('status').textContent = 'Cálculo completado.';
    }
    catch (error) {
        if (current === revision) {
            el('error').textContent = error.message;
            el('error').hidden = false;
            el('empty').hidden = false;
            el('status').textContent = '';
        }
    }
    finally {
        button.disabled = false;
    }
});
renderReference();
el('show-dignity-score').addEventListener('change', applyScoreVisibility);
function inspectTerm(event) { const target = event.target.closest('[data-term]'); if (!target)
    return; const [sign, index] = target.getAttribute('data-term').split('-').map(Number); el('term-info').textContent = termLabel(sign, index); }
for (const event of ['click', 'pointerover', 'focusin'])
    el('wheel').addEventListener(event, inspectTerm);
el('wheel').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    inspectTerm(event);
} });
el('aspect-order').addEventListener('change', updateWheel);
el('download-aspects').addEventListener('click', () => { if (!currentResult || !currentSvg)
    return; const rows = compactAspects(evaluateAspects(currentResult.results.bodies, orbs), currentResult.results.bodies, value('aspect-order')); downloadBlob(new Blob([compactCsv(rows)], { type: 'text/csv;charset=utf-8' }), 'dama-del-tiempo-aspectos.csv'); });
