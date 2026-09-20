"""Generate a standalone offline review document, not application UI."""
from pathlib import Path
import json,html,shutil,collections
B=Path(__file__).resolve().parent
O=B if (B/'catalogo.json').exists() else Path('outputs/catalogo-lotes-revision').resolve()
read=lambda n:json.loads((O/n).read_text(encoding='utf-8'))
C=read('catalogo.json');R=C['records'];S=read('resumen-validacion.json');F=read('fuentes.json');D=read('duplicados-y-variantes.json');OPS=read('operandos.json')
byid={r['id']:r for r in R}
def table(headers,rows):
 esc=lambda x:str(x).replace('|','\\|').replace('\n',' ')
 return '\n'.join(['| '+' | '.join(headers)+' |','| '+' | '.join(['---']*len(headers))+' |']+['| '+' | '.join(map(esc,row))+' |' for row in rows])
stats=[('Filas extraídas',S['rows']),('Marca Dub. (incluye Dub sin punto en fila 150)',S['dubious']),('Marca Mult.',S['multipleSources']),('reverse sin condición',S['unconditionalReverse']),('reverse con condición o atribución',S['qualifiedReverse']),('Columna nocturna vacía',S['blankReverseColumn']),('day sin condición',S['dayOnlyUnqualified']),('night sin condición',S['nightOnlyUnqualified']),('day (AO)',S['dayQualified']),('night (AO)',S['nightQualified']),('Reglas especiales en columna nocturna',S['specialReverseRules']),('Condiciones adicionales indicadas solo en el nombre',S['nameOnlyAdditionalConditions']),('Filas con alguna condición especial (unión)',S['specialConditionsTotal']),('Filas con operandos aún no resolubles',S['unsupportedOperandRows']),('Operandos distintos aún no resolubles',S['unsupportedOperandTypes']),('Nombres principales exactamente duplicados',S['exactDuplicateNameGroups']),('Grupos candidatos de variantes',S['candidateVariantGroups']),('Filas con códigos bibliográficos no definidos',S['rowsWithUnresolvedSources']),('Filas con marcador ⓘ sin contenido recuperable',S['rowsWithInformationMarker'])]
def names(ids):return '; '.join(f"{byid[i]['sourceRow']['row']}: {byid[i]['nameOriginal']}" for i in ids)
def form(r,reverse=False):
 p,s,t=[r[k]['labelSpanish'] for k in ('personalPoint','significator','trigger')]
 return f'{p} + {t} − {s}' if reverse else f'{p} + {s} − {t}'
selected=[byid[f'lusby-traditional-{n:04}'] for n in (111,288,90,206,51,320,211)]
report=f'''# Catálogo de lotes tradicionales — revisión de extracción

Versión **{C['catalogVersion']}**. Compilación de **Eric Lusby**, publicada por Astro-Seek y extraída exclusivamente del PDF adjunto. Cada atribución se conserva: no es un sistema doctrinal único. **No se implementó el motor de cálculo ni se modificó Dama del Tiempo.**

## Resultado

{table(['Comprobación','Cantidad'],stats)}

El PDF tiene una sola página de gran altura y muestra el filtro **Traditional**. El enlace del encabezado dice “Calculates all 508 Lots at once”; la tabla efectivamente adjunta tiene **335 filas**, además de dos filas de cabecera. No se inventaron las 173 restantes.

Los conteos de marcas, problemas y condiciones son independientes y pueden superponerse. Hay **220 filas que mencionan reverse**, pero solo **183** lo hacen sin calificación. Las otras **37** no deben invertirse globalmente.

Hay un registro `day` y uno `night` sin calificación: Exaltation (Day), fila 95, y Exaltation (Night), fila 96. Además, las filas 188 y 191 dicen `day (AO)` y `night (AO)`; AO no está definido en Sources. Las filas 232 y 233 llevan Day/Night en el nombre, con columna nocturna vacía: quedan pendientes. Los grados fijos de las dos exaltaciones también requieren revisar la convención.

Las **41 reglas nocturnas especiales** incluyen las 37 inversiones calificadas, day (AO), night (AO), always below horizon y use both. Se añaden cuatro condiciones detectadas en los nombres (filas 9, 10, 232, 233), dando **45 filas** a revisar por condiciones.

## Archivos

- `catalogo.html`: todas las filas legibles, búsqueda y filtros locales, con detalle de cada registro.
- `catalogo.csv`: tabla UTF-8 con BOM; conserva caracteres y todas las filas.
- `catalogo.json`: catálogo estructurado, fórmulas simbólicas, operandos tipados, reglas y referencias de fila.
- `fuentes.json`: **34 entradas principales y 6 códigos subordinados a RHG**, con referencias completas del PDF y notas de manuscritos.
- `operandos.json`: inventario de operandos, disponibilidad y filas que los usan.
- `duplicados-y-variantes.json`: agrupaciones para revisión, sin fusionar registros.
- `filas-originales.json`, `transcripcion-pdf.txt`, `fuentes-transcripcion.txt`: transcripciones preservadas.
- `validar_catalogo.py`: controles de extracción y coherencia; no realiza cálculos astrológicos.
- `build_catalog.py`, `make_review.py`, `extraer_pdf.py`, `nombres-es.txt`: reconstrucción auditable.

## Siete lotes iniciales solicitados

Las siguientes expresiones se transcriben de las filas indicadas. En ambos casos se propone aplicar `normalizar360(x) = ((x % 360) + 360) % 360`. Son **fórmulas para aprobación**, no resultados calculados. Las siete filas imprimen `reverse` sin calificación.

{table(['Fila','Nombre español / original','Fuente primaria','Diurna','Nocturna'],[[r['sourceRow']['row'],r['nameSpanish']+' / '+r['nameOriginal'],r['primarySource'],form(r),form(r,True)] for r in selected])}

Las fuentes secundarias completas están en cada registro. Fortuna y Espíritu se identifican como dependencias antes de los otros cinco; no se ejecutó aún ese grafo. En el PDF, Eros (Hermetic) y Necessity (Hermetic) no llevan la categoría Hermetic, aunque sí aparece en su nombre. Se conserva esta diferencia. Victory sí incluye Mundane; esa categoría no se elimina por formar parte de la selección solicitada.

## Operandos y límites actuales

“Disponible” significa que la carta actual aporta la posición o los datos base; **no significa que el nuevo motor ya esté implementado**. Las cúspides y regentes quedan ligados al sistema de casas activo. Se propone regencia por domicilio tradicional, pendiente de revisión para las fórmulas que la requieran. Los nodos usarían la opción medio/verdadero de la carta.

Fortune, Spirit y Eros (Valens) son referencias a registros precisos, no nombres reemplazados arbitrariamente. Sus dependencias figuran por ID. No se devuelve cero ante datos faltantes. Los grados explícitos 0 Gemini, 0 Leo y 0 Virgo se identifican como 60°, 120° y 150°; los grados no nulos quedan pendientes para no confundir grado ordinal y longitud desde cero.

{table(['Operando impreso','Motivo pendiente','Filas'],[[o['raw'],o['reason'],', '.join(str(byid[i]['sourceRow']['row']) for i in o['records'])] for o in OPS if o['support']=='unsupported'])}

Los operandos no resolubles afectan **17 filas**. En `status` aparecen 16 `unsupported_operand` porque la fila 312 también es Dub. y conserva `dubious` como estado principal; sus dos banderas permanecen registradas. Del mismo modo, las 14 marcas Mult. se conservan aunque algunos registros tengan estado principal `conditional`.

## Bibliografía incompleta y notas ausentes

{table(['Código sin definición','Filas'],[[code,', '.join(str(r['sourceRow']['row']) for r in R if code in r['unresolvedSourceCodes'])] for code in F['unresolvedCodes']])}

No se expandieron **HT, AO, RB o M**. Las menciones Theophilus y Persians dentro de condiciones se mantienen literales, sin asignarles un código por suposición. La fila 82 tiene “MSV GI” sin coma: se separan como dos códigos existentes, preservando la celda original. Spirit repite VV como primaria y secundaria; se conserva tal como aparece.

En **70 filas** aparece ⓘ, pero el PDF no contiene el texto emergente. Sus 364 anotaciones son enlaces y ninguna aporta contenido de nota. No se consultó la web para reconstruirlo. Los nombres alternativos impresos en cursiva sí se extrajeron por separado. Las referencias bibliográficas conservan las grafías del PDF, incluidas posibles erratas.

## Variantes y duplicados

No hay nombres principales exactamente repetidos tras normalizar espacios y mayúsculas. Se identificaron **59 grupos candidatos de variantes**: quitar paréntesis y sufijos de variante sirve para encontrarlos, pero no autoriza a fusionarlos. Hay **48 grupos de operandos idénticos** y **61 grupos de operandos más regla nocturna idénticos**; el segundo conteo puede ser mayor porque una agrupación se divide al distinguir reglas nocturnas.

{table(['Familia candidata','Registros conservados'],[[g['key'],names(g['records'])] for g in D['candidateNameFamilies']])}

También se conservan las coincidencias de nombres alternativos en `duplicados-y-variantes.json`. No se declaró que dos materias con igual fórmula sean el mismo lote.

## Reglas especiales conservadas

{table(['Fila','Nombre original','Regla nocturna literal / indicación del nombre'],[[r['sourceRow']['row'],r['nameOriginal'],r['reverseNocturnalRaw'] or 'Solo en nombre: '+r['nameOriginal']] for r in R if r['flags']['specialCondition']])}

`reverseAtNight: null` expresa una regla que no puede reducirse a sí/no. `dayFormula` y `nightFormula` son propuestas simbólicas; una fórmula null queda sin resolver o no aplica a esa secta, según las condiciones del registro. `baseFormulaAsPrinted` preserva los tres operandos aun cuando la fórmula no pueda habilitarse. Ninguna es ejecutada por este paquete.

## Criterios de revisión

Todos los registros tienen `extractionReview: pending_user_review`; ninguno se declaró `verified`. Los 31 Dub. quedan desactivados por defecto y requieren una futura activación explícita. Todo el catálogo permanece sin activar hasta aprobar esta etapa.

Las traducciones al español son editoriales, conservan el inglés y los nombres propios de las autoridades, y quedan abiertas a corrección. Los contextos se toman solo de categorías explícitas: no se convierte Hellenistic o Medieval automáticamente en Natal. La selección natal futura deberá respetar las exclusiones y la excepción solicitada para los siete lotes iniciales.

## Validación y reproducción

Se cotejaron visualmente las columnas y las filas de los siete lotes iniciales, así como muestras de variantes, reglas especiales, primeras y últimas filas y bibliografía. Los controles automatizados y su salida se encuentran en `resultado-pruebas.txt`. Son pruebas del catálogo y su transcripción, **no pruebas de un motor que todavía no existe**.

Para repetir los controles: `python validar_catalogo.py`.
Para reconstruir desde el PDF original, con pdfplumber instalado: `python extraer_pdf.py --pdf "ruta/al/documento.pdf"`; luego `python build_catalog.py --pdf "ruta/al/documento.pdf"` y `python make_review.py`.

Fuente: `{C['sourceDocument']['filename']}`. SHA-256: `{C['sourceDocument']['sha256']}`. Las filas llevan página, ordinal y rectángulo en puntos PDF; el origen del rectángulo es superior izquierdo.

**Esta entrega se detiene antes del motor de cálculo, como solicitaste. La próxima etapa requiere tu revisión del catálogo y de los casos pendientes.**
'''
(O/'informe-validacion.md').write_text(report,encoding='utf-8')
payload=json.dumps({'catalog':C,'sources':F,'summary':S},ensure_ascii=False).replace('</','<\\/')
template='''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Catálogo de lotes tradicionales · revisión</title>
<style>
:root{font-family:system-ui,sans-serif;color:#283534;background:#f7f5ef}*{box-sizing:border-box}body{margin:0}main{max-width:1500px;margin:auto;padding:28px 24px}h1{font:600 clamp(1.8rem,3vw,2.6rem) Georgia,serif;margin:.4em 0}h2{font-family:Georgia,serif}p{line-height:1.55;max-width:1050px}a{color:#18675f}.eyebrow{font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:#526c66}.badge{display:inline-block;background:#e8efe8;border:1px solid #cfdbd1;padding:5px 9px;border-radius:5px;font-size:.8rem}.counts{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0}.count{background:#fffdf7;border:1px solid #dddcd2;padding:12px 18px;min-width:125px;border-radius:8px}.count strong{display:block;font-size:1.7rem}.count span{font-size:.85rem}.toolbar{display:flex;flex-wrap:wrap;gap:14px;align-items:end;padding:16px;background:#eeeee5;border-radius:8px}label{display:grid;gap:5px;font-size:.8rem}input,select,button{font:inherit;min-height:38px;padding:8px;border:1px solid #b8c5bd;background:white;border-radius:4px}input[type=search]{width:260px}button{cursor:pointer;color:#175e56}button:hover{background:#eef5ee}.scroll{overflow:auto;border:1px solid #d9ded3;border-radius:6px;background:white}table{border-collapse:collapse;width:100%;font-size:.83rem;min-width:1080px}th{text-align:left;background:#e5ece6;color:#36544a;padding:11px;position:sticky;top:0}td{border-bottom:1px solid #e6e8df;padding:10px;vertical-align:top;line-height:1.45}td:nth-child(2){min-width:225px;max-width:290px}td:nth-child(3){min-width:210px}tbody tr:nth-child(even){background:#fafbf6}.original{display:block;color:#65716a;font-size:.78rem;margin-top:4px}.rowname{border:0;padding:0;min-height:0;background:none;text-align:left;font-weight:650}.tag{font-size:.72rem;background:#eef2e8;padding:2px 5px;border-radius:3px;display:inline-block;margin:2px}.warn{background:#faead1;color:#805c1b}.muted{color:#637369}.notice{border-left:4px solid #ad884b;padding:6px 16px;background:#f4eddd}.seven{min-width:860px}dialog{max-width:900px;width:95%;max-height:90vh;border:1px solid #8fa394;border-radius:9px;padding:24px}dialog::backdrop{background:#162b2466}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.8rem;background:#f3f5ed;padding:14px}dl{display:grid;grid-template-columns:180px 1fr;gap:10px}dd{margin:0}.close{float:right}.source{padding:12px 0;border-bottom:1px solid #ddd}footer{margin-top:26px;color:#637369;font-size:.8rem}@media(max-width:650px){main{padding:18px 12px}.count{min-width:calc(50% - 12px);flex:1}.toolbar label{width:100%}input[type=search],select{width:100%}dl{grid-template-columns:1fr}dd{margin-bottom:8px}}@media print{.toolbar,.links,button.close{display:none}main{padding:0}.scroll{overflow:visible}table{min-width:0;font-size:8pt}h1{font-size:22pt}th{position:static}}
</style><main><div class="eyebrow">Dama del Tiempo · documento de revisión</div><h1>Catálogo de lotes tradicionales</h1><span class="badge">Borrador 0.1.0 · pendiente de revisión</span><p>335 filas del PDF de la compilación de Eric Lusby, publicada por Astro-Seek. Se conservan autoridades, variantes y advertencias. Este documento funciona sin conexión y no calcula posiciones.</p><div class="links"><a href="informe-validacion.md">Informe completo</a> · <a href="catalogo.csv" download>Tabla CSV</a> · <a href="catalogo.json" download>Datos JSON</a> · <a href="fuentes.json" download>Bibliografía JSON</a></div>
<div class="counts"><div class="count"><strong>335</strong><span>filas extraídas</span></div><div class="count"><strong>31</strong><span>marcas Dub.</span></div><div class="count"><strong>14</strong><span>marcas Mult.</span></div><div class="count"><strong>183</strong><span>inversiones sin condición</span></div><div class="count"><strong>17</strong><span>filas con operandos pendientes</span></div></div>
<p class="notice">El encabezado enlaza un calculador de 508 lotes; el PDF adjunto contiene 335. Hay 37 inversiones calificadas adicionales, 41 reglas nocturnas especiales y 4 condiciones señaladas solo en los nombres. Las notas emergentes ⓘ no están incluidas en el PDF.</p>
<h2>Los siete lotes iniciales</h2><p class="muted">Expresiones transcritas para revisar. Todas se normalizarían a [0°, 360°). No son resultados calculados.</p><div class="scroll"><table class="seven"><thead><tr><th>Fila</th><th>Lote</th><th>Diurna</th><th>Nocturna</th><th>Fuente</th></tr></thead><tbody id="seven"></tbody></table></div>
<h2>Catálogo completo</h2><p>Los nombres abren la ficha de auditoría. Las fórmulas dudosas se incluyen en esta revisión; no están activadas en la aplicación.</p><div class="toolbar"><label>Nombre o nombre alternativo<input id="search" type="search" placeholder="Fortuna, Eros, Love…"></label><label>Categoría<select id="category"><option value="">Todas</option></select></label><label>Fuente primaria<select id="primary"><option value="">Todas</option></select></label><label>Fuente secundaria<select id="secondary"><option value="">Todas</option></select></label><label>Revisión<select id="review"><option value="">Todas las filas</option><option value="dubious">Marca Dub.</option><option value="multipleSources">Marca Mult.</option><option value="unsupportedOperand">Operandos pendientes</option><option value="specialCondition">Condiciones especiales</option><option value="unresolvedSource">Fuentes no definidas</option></select></label><button id="reset">Limpiar filtros</button></div><p id="count" aria-live="polite"></p>
<div class="scroll"><table id="catalog"><thead><tr><th>Fila</th><th>Nombre</th><th>Fórmula impresa</th><th>Regla nocturna literal</th><th>Fuentes</th><th>Categorías</th><th>Revisión</th></tr></thead><tbody id="rows"></tbody></table></div>
<details><summary><h2 style="display:inline-block">Diccionario bibliográfico del PDF</h2></summary><div id="sources"></div></details>
<footer>Catálogo local de revisión. No se alteraron los cálculos, las casas, las posiciones, los aspectos ni la rueda. HT, AO, RB y M requieren identificar su fuente. Las traducciones son propuestas editoriales. Los registros conservan su fila original.</footer></main><dialog id="detail"><button class="close" id="close">Cerrar</button><div id="detailbody"></div></dialog>
<script id="data" type="application/json">PAYLOAD</script><script>
const {catalog,sources}=JSON.parse(document.getElementById('data').textContent),all=catalog.records;
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={pending_review:'Pendiente de revisión',dubious:'Dudosa',multiple_sources:'Múltiples fuentes',unsupported_operand:'Operando pendiente',conditional:'Condicional',verified:'Verificada',conflicting_sources:'Fuentes conflictivas'};
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const printed=(r,reverse=false)=>{let [p,s,t]=['personalPoint','significator','trigger'].map(k=>r[k]?.labelSpanish??'Sin identificar');return `${p} + ${reverse?t:s} − ${reverse?s:t}`};
for(const [id,values] of [['category',[...new Set(all.flatMap(r=>r.categories))]],['primary',[...new Set(all.map(r=>r.primarySource))]],['secondary',[...new Set(all.flatMap(r=>r.secondarySources))]]]){for(const value of values.sort()){let o=document.createElement('option');o.value=value;o.textContent=id==='category'?all.find(r=>r.categories.includes(value)).categoriesSpanish[all.find(r=>r.categories.includes(value)).categories.indexOf(value)]:`${value} · ${sources.entries[value]?.name??'Sin definición'}`;$(id).append(o)}}
function draw(){const q=norm($('search').value),list=all.filter(r=>(!q||norm([r.nameSpanish,r.nameOriginal,...r.alternativeNames].join(' ')).includes(q))&&(!$('category').value||r.categories.includes($('category').value))&&(!$('primary').value||r.primarySource===$('primary').value)&&(!$('secondary').value||r.secondarySources.includes($('secondary').value))&&(!$('review').value||r.flags[$('review').value]));$('count').textContent=`${list.length} de ${all.length} filas · orden del PDF`;$('rows').innerHTML=list.map(r=>`<tr data-id="${r.id}"><td>${r.sourceRow.row}</td><td><button class="rowname" data-open="${r.id}">${esc(r.nameSpanish)}</button><span class="original">${esc(r.nameOriginal)}</span>${r.alternativeNames.length?`<span class="original">Alternativos: ${esc(r.alternativeNames.join('; '))}</span>`:''}</td><td>${esc(printed(r))}</td><td>${esc(r.reverseNocturnalRaw||'— (celda vacía)')}</td><td><strong>${esc(r.primarySource)}</strong><span class="original">${esc(r.secondarySources.join(', ')||'Sin secundaria impresa')}</span></td><td>${r.categoriesSpanish.map(c=>`<span class="tag">${esc(c)}</span>`).join('')}</td><td>${esc(labels[r.status])}${r.flags.dubious?'<br><span class="tag warn">Dub.</span>':''}${r.flags.multipleSources?'<br><span class="tag">Mult.</span>':''}${r.flags.unsupportedOperand?'<br><span class="tag warn">Operando pendiente</span>':''}</td></tr>`).join('')}
for(const id of ['search','category','primary','secondary','review'])$(id).addEventListener('input',draw);
$('reset').onclick=()=>{for(const id of ['search','category','primary','secondary','review'])$(id).value='';draw()};
$('seven').innerHTML=[111,288,90,206,51,320,211].map(n=>all[n-1]).map(r=>`<tr><td>${r.sourceRow.row}</td><td>${esc(r.nameSpanish)}<span class="original">${esc(r.nameOriginal)}</span></td><td>${esc(printed(r))}</td><td>${esc(printed(r,true))}</td><td>${esc(r.primarySource)}</td></tr>`).join('');
$('rows').onclick=e=>{const b=e.target.closest('[data-open]');if(!b)return;const r=all.find(r=>r.id===b.dataset.open);$('detailbody').innerHTML=`<h2>${esc(r.nameSpanish)}</h2><p>${esc(r.nameOriginal)} · fila ${r.sourceRow.row}</p><dl><dt>Fórmula impresa</dt><dd>${esc(printed(r))}</dd><dt>Regla nocturna</dt><dd>${esc(r.reverseNocturnalRaw||'Celda vacía: no invertir, salvo condiciones pendientes del nombre.')}</dd><dt>Estado</dt><dd>${esc(labels[r.status])} · revisión del usuario pendiente</dd><dt>Fuente primaria</dt><dd>${esc(r.primarySource)} · ${esc(sources.entries[r.primarySource]?.name??'Sin definición')}</dd><dt>Manuscritos</dt><dd>${esc(r.manuscriptVariants.join(', ')||'Sin marca')}</dd></dl><ul>${r.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><details><summary>Registro estructurado completo</summary><pre>${esc(JSON.stringify(r,null,2))}</pre></details>`;$('detail').showModal()};
$('close').onclick=()=>$('detail').close();
$('sources').innerHTML=Object.values(sources.entries).map(s=>`<div class="source"><strong>${esc(s.code)} · ${esc(s.name)}</strong>${s.citedIn?`<p>Citado en ${esc(s.citedIn)}; no se imprime una obra independiente.</p>`:`<ul>${s.references.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`}</div>`).join('');draw();
</script></html>'''
(O/'catalogo.html').write_text(template.replace('PAYLOAD',payload),encoding='utf-8')
if (B/'make_review.py').resolve()!=(O/'make_review.py').resolve():shutil.copyfile(B/'make_review.py',O/'make_review.py')
print('Generados catalogo.html e informe-validacion.md')
