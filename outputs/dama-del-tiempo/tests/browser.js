// Banco de pruebas real del navegador, sin dependencias adicionales.
import {pngBlob,renderWheel,defaultOptions,bodyGlyphs} from '/wheel.js';
const frame=document.querySelector('#app'),checks=document.querySelector('#checks');let passed=0,failed=0;
function assert(value,message){if(!value)throw Error(message);}
async function until(fn){const start=performance.now();while(!fn()){if(performance.now()-start>12000)throw Error('Tiempo agotado esperando la interfaz.');await new Promise(r=>setTimeout(r,30));}}
async function check(name,fn){try{await fn();passed++;const li=document.createElement('li');li.className='pass';li.textContent='OK · '+name;checks.append(li);}catch(e){failed++;const li=document.createElement('li');li.className='fail';li.textContent='FALLÓ · '+name+': '+e.message;checks.append(li);}}
await until(()=>frame.contentDocument?.querySelector('#calculate')&&!frame.contentDocument.querySelector('#calculate').disabled);
const doc=frame.contentDocument,get=id=>doc.getElementById(id);
const change=(id,value)=>{get(id).value=value;get(id).dispatchEvent(new Event('change',{bubbles:true}));};
const fill=(id,value)=>{get(id).value=value;get(id).dispatchEvent(new Event('input',{bubbles:true}));};
const svg=()=>get('wheel').querySelector('svg');
const positions=()=>[...svg().querySelectorAll('[data-planet]')].map(p=>[p.dataset.planet,p.dataset.longitude]);
await check('Tabla tradicional completa disponible sin calcular carta',()=>{assert(get('traditional-table').tBodies[0].rows.length===12,'Faltan signos');assert(get('results').hidden,'Hay carta sin cálculo');});
get('sample').click();get('chart-form').requestSubmit();
await until(()=>svg()&&!get('results').hidden);
let original=JSON.stringify(positions());
await check('SVG válido, accesible, 360 marcas y nueve cuerpos',()=>{assert(!new DOMParser().parseFromString(svg().outerHTML,'image/svg+xml').querySelector('parsererror'),'XML inválido');assert(svg().querySelector('desc'),'Falta descripción');assert(svg().querySelectorAll('[data-degree]').length===360,'Marcas');assert(positions().length===9,'Cuerpos');});
for(const system of ['alcabitius','regiomontanus','placidus','whole_sign'])await check('Selector, tabla, rueda y exportación coinciden: '+system,async()=>{
 change('house-system',system);await until(()=>!get('results').hidden&&svg()?.dataset.houseSystem===system);
 assert(JSON.stringify(positions())===original,'Cambiaron planetas');
 const cusps=[...svg().querySelectorAll('[data-cusp]')],rows=[...get('cusps').rows];assert(cusps.length===12&&rows.length===12,'Doce cúspides');
 for(let i=0;i<12;i++)assert(Math.abs(Number(cusps[i].dataset.longitude)-parseFloat(rows[i].cells[4].textContent))<.000001,'Tabla/rueda distintos');
 const serialized=new XMLSerializer().serializeToString(svg()),parsed=new DOMParser().parseFromString(serialized,'image/svg+xml');assert(parsed.documentElement.getAttribute('data-house-system')===system,'SVG pierde sistema');
 if(system==='whole_sign'){assert(cusps.every(c=>Number(c.dataset.longitude)%30===0),'No empiezan a cero');assert(Number(svg().querySelector('[data-axis="ASC"]').dataset.longitude)!==Number(cusps[0].dataset.longitude),'ASC confundido con I');}
});
await check('Semisumas precargadas, tabla y rueda coinciden, personalización y restablecimiento',()=>{
 const inputs=[...get('orb-inputs').querySelectorAll('input')];assert(inputs.length===7&&inputs.every(i=>i.value!==''),'No hay siete orbes');
 const count=()=>get('aspect-list').rows.length;
 assert(count()===svg().querySelectorAll('[data-aspect]').length,'Tabla y rueda difieren');const initial=count();
 inputs.forEach(i=>{i.value='0';i.dispatchEvent(new Event('input',{bubbles:true}));});assert(count()===0,'No actualiza');
 get('reset-orbs').click();assert(count()===initial&&inputs[0].value==='15','No restablece');
 get('show-aspects').click();assert(!svg().querySelector('[data-aspect]'),'No oculta');get('show-aspects').click();assert(svg().querySelectorAll('[data-aspect]').length===initial,'No recupera');
});
await check('Aspectos compactos: cinco columnas, solo válidos, orden y exportación coincidente',async()=>{
 const rows=[...get('aspect-list').rows];assert(rows.length===8,'Conjunto válido cambiado');
 for(const r of rows){assert(r.cells.length===5,'Columnas');assert(/^\d+°\d{2}′\d{2}″$/.test(r.cells[3].textContent),'Orbe no sexagesimal');assert(['Aplicativo','Separativo','Partil','Indeterminado'].includes(r.cells[4].textContent),'Vocabulario');}
 assert(!get('aspect-detail'),'Conserva detalle técnico');assert(!get('aspect-list').querySelector('button,details'),'Filas desplegables');
 const keys=()=>[...get('aspect-list').rows].map(r=>[r.dataset.from,r.dataset.aspect,r.dataset.to].join('|')).sort();
 const expected=[...svg().querySelectorAll('[data-aspect]')].map(g=>[g.dataset.aspectFrom,g.dataset.aspect,g.dataset.aspectTo].join('|')).sort();assert(JSON.stringify(keys())===JSON.stringify(expected),'Tabla y rueda distintas');
 const original=JSON.stringify(keys());change('aspect-order','orb');assert(JSON.stringify(keys())===original,'Ordenar cambia aspectos');const parsed=[...get('aspect-list').rows].map(r=>{const [d,m,s]=r.cells[3].textContent.match(/\d+/g).map(Number);return d*3600+m*60+s;});assert(parsed.every((n,i)=>i===0||n>=parsed[i-1]),'Orden de orbe incorrecto');change('aspect-order','planet');
 assert(!/semisuma|Velocidad|Exceso|Separación angular/.test(get('compact-aspects').textContent),'Datos técnicos visibles');
 assert(!/orbe \d+\.\d+/.test(svg().querySelector('desc').textContent),'SVG conserva orbe decimal');
});
await check('Orbe inválido impide una exportación obsoleta y se recupera al corregir',()=>{const input=get('orb-inputs').querySelector('input');input.value='-1';input.dispatchEvent(new Event('input',{bubbles:true}));assert(!svg(),'Conserva rueda obsoleta');assert(get('download-svg').disabled&&get('download-png').disabled,'Permite descargar');input.value='6';input.dispatchEvent(new Event('input',{bubbles:true}));assert(svg()&&!get('download-svg').disabled,'No recupera rueda');});
await check('Ocultar grados y cúspides conserva los ángulos reales',()=>{get('show-degrees').click();assert(!svg().querySelector('[data-label="10°22′"]'),'No oculta grado');get('show-degrees').click();get('show-cusps').click();assert(!svg().querySelector('[data-cusp]'),'No oculta cúspides');assert(svg().querySelectorAll('[data-axis]').length===4,'Ocultó ángulos');get('show-cusps').click();});
for(const mobile of [false,true])await check('Sin recortes ni desbordamiento: '+(mobile?'390 px':'1366 px'),async()=>{
 frame.classList.toggle('mobile',mobile);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 assert(doc.documentElement.scrollWidth<=frame.clientWidth,'Desbordamiento de página');const rect=svg().getBoundingClientRect();assert(Math.abs(rect.width-rect.height)<1,'No es cuadrada');
 const inverse=svg().getScreenCTM().inverse();
 for(const path of svg().querySelectorAll('path')){const b=path.getBBox(),matrix=inverse.multiply(path.getScreenCTM());for(const [x,y] of [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]]){const p=new DOMPoint(x,y).matrixTransform(matrix);assert(p.x>=svg().viewBox.baseVal.x&&p.y>=svg().viewBox.baseVal.y&&p.x<=svg().viewBox.baseVal.x+svg().viewBox.baseVal.width&&p.y<=svg().viewBox.baseVal.y+svg().viewBox.baseVal.height,'Glifo fuera del SVG');}}
 if(mobile){change('wheel-zoom','300');assert(get('wheel').clientWidth>get('wheel').parentElement.clientWidth*2.9,'Zoom no funciona');assert(doc.documentElement.scrollWidth<=frame.clientWidth,'Zoom desborda página');change('wheel-zoom','100');}
});
await check('Dignidades, referencia y anillo consultan los mismos datos; control, toque y puntuación',async()=>{
 const {terms,referenceRows,evaluateDignities}=await import('/dignities.js');
 assert(get('dignities-cards').children.length===7,'No hay siete planetas');
 for(const card of get('dignities-cards').children){const name=card.dataset.dignityPlanet,longitude=Number(svg().querySelector(`[data-planet="${name}"]`).dataset.longitude),r=evaluateDignities(name,longitude,'diurna');const rows=card.querySelectorAll('tr');for(let i=0;i<7;i++){assert(rows[i].cells[0].textContent===r.testimonies[i].dignity,'Nombre distinto');assert(rows[i].cells[1].textContent===(r.testimonies[i].found?'Sí':'No'),'Cálculo y tabla de dignidades difieren');}}assert(get('traditional-table').tBodies[0].rows.length===12,'Faltan signos');
 const ref=referenceRows(),groups=[...svg().querySelectorAll('[data-term]')];assert(groups.length===60,'Faltan términos');
 for(const group of groups){const [i,j]=group.dataset.term.split('-').map(Number),term=ref[i].terms[j];assert(Number(group.dataset.start)===i*30+term.start&&Number(group.dataset.end)===i*30+term.end&&group.dataset.ruler===term.ruler,'Límite/regente distinto');assert(get('traditional-table').tBodies[0].rows[i].cells[8].textContent.includes(`${term.ruler} [${term.start}°, ${term.end}°)`),'Referencia distinta');}
 groups[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));assert(get('term-info').textContent.includes('Aries: [0°, 6°), Júpiter'),'Toque sin explicación');
 const previous=JSON.stringify(positions());get('show-terms').click();assert(!svg().querySelector('[data-term]'),'No oculta');assert(JSON.stringify(positions())===previous,'Cambia planetas');get('show-terms').click();assert(svg().querySelectorAll('[data-term]').length===60,'No recupera');
 assert([...doc.querySelectorAll('.dignity-score')].every(r=>r.hidden),'Puntuación visible por defecto');get('show-dignity-score').click();assert([...doc.querySelectorAll('.dignity-score')].every(r=>!r.hidden),'No muestra puntuación');get('show-dignity-score').click();
 const labels=[...svg().querySelectorAll('[data-term] [data-label]')].map(g=>g.getBoundingClientRect());
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),'Etiquetas de términos superpuestas');}
});
await check('Lotes: siete iniciales, cuatro casas y longitudes idénticas en tabla y rueda',async()=>{
 await until(()=>get('lot-results').rows.length===7&&[...get('lot-results').rows].every(r=>[4,5,6,7].every(i=>/^\d+$/.test(r.cells[i].textContent))));
 const rows=[...get('lot-results').rows],marks=[...svg().querySelectorAll('[data-lot-id]')];assert(marks.length===7,'No dibuja siete lotes');
 for(const mark of marks){const row=rows.find(r=>r.dataset.resultLot===mark.dataset.lotId);assert(row&&row.dataset.longitude===mark.dataset.longitude,'Longitud tabla/rueda diferente');assert(/^\d+°\d{2}′$/.test(row.cells[3].textContent),'Longitud decimal visible');}
 assert(JSON.stringify(positions())===original,'Lotes cambiaron planetas');assert(!get('lot-dubious').checked,'Dub activado inicialmente');
});
await check('Lotes: ocultar, solo Fortuna/Espíritu y recuperar selección',()=>{
 get('lot-hide').click();assert(!svg().querySelector('[data-lot-id]'),'No oculta lotes');assert(get('lot-results').rows.length===7,'Ocultar elimina resultados');
 get('lot-two').click();assert(svg().querySelectorAll('[data-lot-id]').length===2,'No reduce a dos');get('lot-defaults').click();assert(svg().querySelectorAll('[data-lot-id]').length===7,'No restaura siete');
});
await check('Lotes: filtros por alternativo, fuentes, Mult. y Dub.',()=>{
 fill('lot-query','Daimon');assert(get('lot-catalog').rows.length===1,'Alternativo');fill('lot-query','');fill('lot-primary','PA');assert(get('lot-catalog').rows.length===5,'Primaria');fill('lot-primary','');fill('lot-secondary','HT');assert(get('lot-catalog').rows.length===4,'Secundaria');fill('lot-secondary','');get('lot-multiple').click();assert(get('lot-catalog').rows.length===14,'Mult.');get('lot-multiple').click();assert(get('lot-catalog').rows.length===304,'Dub. visibles sin permiso');get('lot-dubious').click();assert(get('lot-catalog').rows.length===335,'Dub. no incluidos');get('lot-dubious').click();
});
await check('Lotes: favorito e individual; no se calculan todos al seleccionar contexto',()=>{
 fill('lot-query','Fortuna');const star=get('lot-catalog').querySelector('[data-favorite]');const previous=star.getAttribute('aria-pressed');if(previous==='true')star.click();get('lot-catalog').querySelector('[data-favorite]').click();get('lot-favorites').click();assert([...get('lot-results').rows].some(r=>r.dataset.resultLot==='lusby-traditional-0111'),'No activa favorito');get('lot-catalog').querySelector('[data-favorite]').click();if(previous==='true')get('lot-catalog').querySelector('[data-favorite]').click();
 get('lot-catalog').querySelector('[data-calculate]').click();assert(svg().querySelector('[data-lot-id="lusby-traditional-0111"]'),'Cálculo individual');fill('lot-query','');get('lot-defaults').click();change('lot-context','Weather');assert(get('lot-results').rows.length===7,'Calcula todo al cambiar contexto');assert(!svg().querySelector('[data-lot-id]'),'Mantiene lotes de otro contexto');get('lot-all').click();assert(get('lot-results').rows.length>0&&get('lot-results').rows.length<=12,'Cálculo de contexto incorrecto');get('lot-defaults').click();
});
await check('Lotes: regla bloqueada visible y explicación bibliográfica',()=>{
 fill('lot-query','Exaltación (día)');assert(get('lot-catalog').rows.length===1,'No encuentra lote');assert(get('lot-catalog').querySelector('[data-calculate]').disabled,'Permite operando ambiguo');get('lot-catalog').querySelector('[data-detail]').click();assert(get('lot-detail').open,'No abre regla');assert(get('lot-detail-content').textContent.includes('18 Aries'),'Fórmula ausente');assert(get('lot-detail-content').textContent.includes('Vettius Valens'),'Bibliografía ausente');get('lot-close').click();fill('lot-query','');
});
await check('Profecciones: edad, ciclo, ficha, puntos y capa sin cambiar posiciones natales',()=>{
 const before=JSON.stringify(positions());change('pf-age','40');change('pf-show',true);get('pf-show').checked=true;get('pf-show').dispatchEvent(new Event('change'));
 assert(get('pf-result').textContent.includes('Edad 40'),'Edad ausente');assert(get('pf-result').textContent.includes('Casa V profectada'),'Casa incorrecta');assert(get('pf-result').querySelector('.pf-active').cells[0].textContent==='4','Ciclo incorrecto');assert(svg().querySelector('#profection-layer').dataset.house==='5','Rueda difiere');
 const sol=get('pf-points').querySelector('input[value="Sol"]');sol.checked=true;sol.dispatchEvent(new Event('change',{bubbles:true}));assert(svg().querySelector('[data-profected-id="Sol"]'),'No profecta Sol');assert(get('pf-result').textContent.includes('Ficha natal del señor del año'),'Ficha ausente');assert(JSON.stringify(positions())===before,'Movió planetas');
 get('pf-next').click();assert(get('pf-result').textContent.includes('Edad 41'),'Siguiente');get('pf-prev').click();assert(get('pf-result').textContent.includes('Edad 40'),'Anterior');
});
await check('Profecciones: fecha civil, lotes existentes, capa exportable y ocultación',()=>{
 change('pf-date','2026-01-01');change('pf-mode','date');assert(get('pf-result').textContent.includes('Edad 26'),'Fecha civil incorrecta');const fortune=get('pf-points').querySelector('input[value="lusby-traditional-0111"]');assert(fortune,'Fortuna no disponible');fortune.checked=true;fortune.dispatchEvent(new Event('change',{bubbles:true}));assert(svg().querySelector('[data-profected-id="lusby-traditional-0111"]'),'No usa Fortuna');assert(new XMLSerializer().serializeToString(svg()).includes('profection-layer'),'Exportación sin capa');get('pf-show').checked=false;get('pf-show').dispatchEvent(new Event('change'));assert(!svg().querySelector('#profection-layer'),'No oculta capa');
});
await check('PNG válido de 3300 × 3300 y modo impresión sin fuentes externas',async()=>{change('wheel-mode','print');const source=new XMLSerializer().serializeToString(svg());assert(svg().querySelectorAll('[data-term]').length===60,'Faltan términos en SVG exportado');assert(!source.includes('#fffaf0'),'Color de pantalla en impresión');assert(!source.includes('<text'),'Texto depende de fuentes');const blob=await pngBlob(source);assert(blob.type==='image/png','No es PNG');const bitmap=await createImageBitmap(blob);assert(bitmap.width===3300&&bitmap.height===3300,'Resolución incorrecta');bitmap.close();change('wheel-mode','color');});
await check('Placidus polar: error, sin carta parcial, recuperación al elegir signos enteros',async()=>{
 fill('date','2024-06-21');fill('time','12:00:00');fill('latitude','69.6492');fill('longitude','18.9553');fill('timezone','Etc/UTC');get('chart-form').requestSubmit();await until(()=>!get('results').hidden);
 change('house-system','placidus');await until(()=>!get('error').hidden);assert(get('error').textContent.includes('HOUSE_CALCULATION_FAILED'),'Error no identificado');assert(get('results').hidden,'Presenta resultados parciales');change('house-system','whole_sign');await until(()=>!get('results').hidden);assert(svg().dataset.houseSystem==='whole_sign','No recupera');
});
await check('Presentación: cuatro áreas y seis pestañas, sin perder controles',()=>{
 const nav=doc.querySelectorAll('.main-nav button');assert(nav.length===4,'Navegación incompleta');nav[3].click();assert(!get('view-saved').hidden&&get('view-saved').textContent.includes('Todavía no hay cartas guardadas'),'Estado vacío');nav[0].click();assert(get('chart-form').contains(get('house-system')),'Casas fuera del formulario');assert(get('chart-form').querySelector('details summary').textContent==='Opciones avanzadas','Avanzadas');nav[2].click();const tabs=[...doc.querySelectorAll('[role=tab]')];assert(tabs.length===6,'Pestañas incompletas');for(const tab of tabs){tab.click();assert(doc.querySelectorAll('[role=tabpanel]:not([hidden])').length===1,'Múltiples tablas abiertas');}assert(get('lot-catalog')&&get('pf-result')&&get('aspect-list'),'Se perdió un módulo');
});
await check('Presentación: teclado, foco, formularios y errores accesibles',()=>{
 const first=doc.querySelector('[role=tab]');first.click();first.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert(doc.activeElement.id==='tab-aspects','Flecha sin foco');assert(get('analysis-positions').hidden&&!get('analysis-aspects').hidden,'Flecha no cambia panel');doc.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));assert(doc.activeElement.id==='tab-predictive','End');
 doc.querySelector('[data-view="0"]').click();const date=get('date'),originalDate=date.value;date.value='';date.dispatchEvent(new Event('invalid'));assert(!get('form-error').hidden&&get('form-error').textContent.includes('fecha'),'Error no comprensible');assert(date.getAttribute('aria-invalid')==='true','Error no accesible');date.value=originalDate;date.dispatchEvent(new Event('input',{bubbles:true}));assert(get('form-error').hidden,'Error obsoleto');get('sample').click();get('chart-form').requestSubmit();
});
await until(()=>!get('results').hidden);
await check('Presentación adaptable: 360 px, tablet y escritorio sin desbordamientos',async()=>{
 for(const width of [360,768,1366]){frame.style.width=width+'px';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));for(let area=0;area<4;area++){doc.querySelector(`[data-view="${area}"]`).click();if(area===2){for(const tab of doc.querySelectorAll('[role=tab]')){tab.click();assert(doc.documentElement.scrollWidth<=doc.documentElement.clientWidth+1,`Desborde ${width} ${tab.textContent}`);}}assert(doc.documentElement.scrollWidth<=doc.documentElement.clientWidth+1,`Desborde ${width} área ${area}`);}doc.querySelector('[data-view="1"]').click();change('wheel-zoom','100');const viewport=doc.querySelector('.wheel-viewport').getBoundingClientRect();assert(viewport.width<=width&&viewport.left>=0,'Rueda recortada');assert(Math.abs(svg().getBoundingClientRect().width-viewport.width)<3,'Rueda no encaja');}
 frame.style.width='100%';
});
document.querySelector('#summary').textContent=`${passed} pruebas aprobadas; ${failed} fallidas.`;
document.querySelector('#summary').dataset.passed=String(passed);document.querySelector('#summary').dataset.failed=String(failed);
