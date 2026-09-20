import {evaluateDignities,referenceRows,dignitySystem,rulerships,triplicities,terms,faces,type Sect,type Segment} from './dignities.js';
const get=(id:string)=>document.getElementById(id)!;
const span=(s:Segment)=>`${s.ruler} [${s.start}°, ${s.end}°)`;
function row(table:HTMLTableElement,values:string[]){const tr=table.insertRow();values.forEach(v=>{const c=tr.insertCell();c.textContent=v;});return tr;}
function sourceLink(label:string,url:string){const link=document.createElement('a');link.textContent=label;link.href=url;link.target='_blank';link.rel='noreferrer';return link;}
export function renderReference(){
 const target=get('dignities-reference');target.replaceChildren();
 const wrapper=document.createElement('div');wrapper.className='table-wrap';wrapper.tabIndex=0;
 const table=document.createElement('table');table.id='traditional-table';const caption=table.createCaption();caption.textContent=dignitySystem+' · Triplicidades de Doroteo';
 const head=table.createTHead().insertRow();['Signo','Domicilio','Detrimento','Exaltación (grado de referencia)','Caída (grado de referencia)','Triplicidad diurna','Nocturna','Participante','Cinco términos egipcios','Tres faces'].forEach(text=>{const th=document.createElement('th');th.scope='col';th.textContent=text;head.append(th);});
 const tbody=document.createElement('tbody');table.append(tbody);
 for(const r of referenceRows()){
  const tr=document.createElement('tr');tbody.append(tr);
  [r.sign,r.domicile,r.detriment,r.exaltation?`${r.exaltation.planet} (${r.exaltation.degree}°)`:'—',r.fall?`${r.fall.planet} (${r.fall.degree}°)`:'—',r.triplicity.day,r.triplicity.night,r.triplicity.participant,r.terms.map(span).join('; '),r.faces.map(span).join('; ')].forEach(text=>{const td=document.createElement('td');td.textContent=text;tr.append(td);});
 }
 wrapper.append(table);target.append(wrapper);
 const sources=document.createElement('p');sources.className='hint';
 for(const data of [rulerships,triplicities,terms,faces]){sources.append(sourceLink(`${data.system}: ${data.source} · v${data.version}`,data.reference),document.createElement('br'));}
 target.append(sources);
}
export function renderChartDignities(bodies:ReadonlyArray<{name:string;longitude:number;position:string}>,sect:{name:Sect;solar_altitude:number;rule:string}){
 get('sect-description').textContent=`Carta ${sect.name}. Altura solar geométrica: ${sect.solar_altitude.toFixed(6)}°. ${sect.rule}`;
 const target=get('dignities-cards');target.replaceChildren();
 for(const body of bodies.filter(b=>['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(b.name))){
  const result=evaluateDignities(body.name,body.longitude,sect.name),card=document.createElement('article');card.className='dignity-card';card.dataset.dignityPlanet=body.name;
  const heading=document.createElement('h4');heading.textContent=`${body.name} · ${body.position}`;card.append(heading);
  const table=document.createElement('table');table.setAttribute('aria-label',`Dignidades de ${body.name}`);
  for(const t of result.testimonies){row(table,[t.dignity,t.found?'Sí':'No',t.ruler??'—']);}
  row(table,['Término que ocupa',span(result.term),'Egipcio']);row(table,['Face que ocupa',span(result.face),'Caldea']);
  row(table,['Triplicidad diurna / nocturna',`${result.triplicity.day} / ${result.triplicity.night}`,`Principal: ${result.principal}`]);
  row(table,['Participante',result.participant,result.participantIsPlanet?'Es este planeta; informado separadamente':'Informado separadamente']);
  row(table,['Peregrinidad',result.peregrine?'Sí':'No',result.peregrinityExplanation]);
  const score=row(table,['Puntuación según William Lilly',String(result.score),'Suma opcional; no sustituye los testimonios.']);score.className='dignity-score';
  card.append(table);
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Reglas aplicadas y fuentes';details.append(summary);
  for(const t of result.testimonies){const p=document.createElement('p');p.textContent=`${t.dignity}: ${t.explanation} Longitud ${t.longitude.toFixed(9)}°, ${t.sign}, carta ${t.sect}. ${t.termsSystem}. `;p.append(sourceLink(t.source,t.reference));details.append(p);}
  card.append(details);target.append(card);
 }
 applyScoreVisibility();
}
export function applyScoreVisibility(){const show=(get('show-dignity-score') as HTMLInputElement).checked;document.querySelectorAll<HTMLElement>('.dignity-score').forEach(row=>row.hidden=!show);}
