import { activation, annualProfection, method, sourceLabel } from './profections.js';
import { downloadBlob } from './wheel.js';
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const table = (head, rows) => `<div class="table-wrap"><table><thead><tr>${head.map(v => `<th>${esc(v)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function initProfections(root, onChange) {
    let natal = null, result = null;
    const selected = new Set();
    root.innerHTML = `<h2>Profecciones anuales</h2><p>${method}. Aniversarios civiles; comienzo inclusivo y final exclusivo. Posiciones simbólicas, no tránsitos.</p><div class="profection-controls"><label>Consultar por <select id="pf-mode"><option value="age">Edad</option><option value="date">Fecha objetivo</option></select></label><label>Edad <input id="pf-age" type="number" min="0" step="1" value="0"></label><label>Fecha objetivo <input id="pf-date" type="date"></label><label>Aniversario del 29 de febrero en años no bisiestos <select id="pf-leap"><option value="feb28">28 de febrero</option><option value="mar1">1 de marzo</option></select></label></div><div class="profection-controls"><button id="pf-prev" type="button">Año anterior</button><button id="pf-next" type="button">Año siguiente</button><button id="pf-now" type="button">Ir al año actual</button><label><input id="pf-show" type="checkbox"> Mostrar profección</label><button id="pf-export" type="button">Exportar resultado JSON</button></div><p id="pf-error" role="status"></p><div id="pf-result"></div><details><summary>Puntos profectados avanzados</summary><p>El Ascendente determina siempre al señor del año. Los lotes se toman de los resultados natales calculados en su módulo.</p><div id="pf-points" class="profection-controls"></div></details><p class="hint">${sourceLabel}</p>`;
    const el = (id) => root.querySelector('#' + id);
    const val = (id) => el(id).value;
    function render() {
        result = null;
        el('pf-result').replaceChildren();
        el('pf-error').textContent = '';
        el('pf-age').disabled = val('pf-mode') !== 'age';
        el('pf-date').disabled = val('pf-mode') !== 'date';
        if (!natal) {
            el('pf-error').textContent = 'Calculá una carta natal para consultar profecciones.';
            el('pf-export').disabled = true;
            return;
        }
        try {
            if (val('pf-mode') === 'age' && !val('pf-age').trim())
                throw Error('Ingresá una edad.');
            result = annualProfection(natal, { ...(val('pf-mode') === 'age' ? { age: Number(val('pf-age')) } : { date: val('pf-date') }), policy: val('pf-leap'), selected: [...selected] });
            const r = result, c = r.natalLordCondition;
            el('pf-result').innerHTML = `<h3>Edad ${r.age} — Casa ${roman[r.activatedHouse - 1]} profectada — ${r.activatedSign} activado — Señor del año: ${r.lordOfYear}</h3><p>Desde ${r.periodStart} hasta antes de ${r.periodEnd}. Calendario gregoriano; aniversario civil.</p><h3>Ficha natal del señor del año</h3>${table(['Planeta', 'Posición natal', 'Casa natal · ' + natal.houseSystem, 'Movimiento', 'Velocidad °/día', 'Secta'], [[c.name, c.position, c.house, c.motion, c.speed, c.sect]])}<p>Casas regidas por signos enteros: ${c.ruledWholeSignHouses.map(h => roman[h - 1]).join(', ')}. Casas por regencia de las cúspides visibles (${esc(natal.houseSystem)}): ${c.ruledVisibleHouses.map(h => roman[h - 1]).join(', ')}.</p><p>${esc(c.dignities.system)}: ${c.dignities.testimonies.filter(t => t.found).map(t => esc(t.dignity)).join(' · ') || 'Sin testimonios positivos ni debilidades propias'}${c.dignities.peregrine ? ' · Peregrino' : ''}. Participante de triplicidad: ${c.dignities.participant}.</p><details><summary>Reglas y fuentes de dignidades</summary>${table(['Testimonio', 'Presente', 'Regla', 'Fuente'], c.dignities.testimonies.map(t => [t.dignity, t.found ? 'Sí' : 'No', t.explanation, t.source]))}</details><h3>Aspectos natales del señor del año</h3>${c.aspects.length ? table(['Primer cuerpo', 'Aspecto', 'Segundo cuerpo', 'Orbe', 'Movimiento'], c.aspects) : '<p>Sin aspectos dentro de los orbes actuales.</p>'}<h3>Posiciones profectadas por signo</h3>${table(['Marca', 'Punto', 'Posición natal', 'Posición profectada por signo'], r.profectedPoints.map((p, i) => ['P' + (i + 1), p.name, p.natalPosition, p.position]))}<h3>Ciclo de doce años</h3><div class="table-wrap"><table><thead><tr><th>Resto</th><th>Casa</th><th>Signo activado</th><th>Regente</th></tr></thead><tbody>${Array.from({ length: 12 }, (_, i) => { const a = activation(natal.asc, i); return `<tr ${i === r.cycleIndex ? 'class="pf-active" aria-current="true"' : ''}><td>${i}</td><td>${roman[i]}</td><td>${a.activatedSign}</td><td>${a.lordOfYear}</td></tr>`; }).join('')}</tbody></table></div><details><summary>Cronología de 0 a 100 años</summary>${table(['Edad', 'Casa', 'Signo', 'Señor del año'], Array.from({ length: 101 }, (_, i) => { const a = activation(natal.asc, i); return [i, roman[a.activatedHouse - 1], a.activatedSign, a.lordOfYear]; }))}</details>`;
        }
        catch (e) {
            el('pf-error').textContent = e.message;
        }
        el('pf-export').disabled = !result;
    }
    function change() { render(); onChange(); }
    for (const id of ['pf-mode', 'pf-age', 'pf-date', 'pf-leap', 'pf-show'])
        el(id).addEventListener('change', change);
    for (const [id, delta] of [['pf-prev', -1], ['pf-next', 1]])
        el(id).onclick = () => { if (!result)
            return; el('pf-age').value = String(Math.max(0, result.age + delta)); el('pf-mode').value = 'age'; change(); };
    el('pf-now').onclick = () => { const today = new Date(), date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`; el('pf-date').value = date; el('pf-mode').value = 'date'; change(); };
    el('pf-export').onclick = () => { if (result)
        downloadBlob(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json;charset=utf-8' }), 'dama-del-tiempo-profeccion.json'); };
    el('pf-points').addEventListener('change', e => { const input = e.target; if (input.checked)
        selected.add(input.value);
    else
        selected.delete(input.value); change(); });
    render();
    return { setNatal(value) { natal = value; el('pf-points').innerHTML = (natal?.points || []).map(p => `<label><input type="checkbox" value="${esc(p.id)}" ${selected.has(p.id) ? 'checked' : ''}>${esc(p.name)}</label>`).join(''); render(); }, layer() { return el('pf-show').checked ? result : null; }, result() { return result; } };
}
