import {point,outlinedText,layoutBodies} from './wheel.js';
import type {Profection} from './profections.js';
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function appendProfection(svg:string,result:Profection|null,asc:number,print=false){if(!result)return svg;const r=result,start=r.activatedSignIndex*30,ink=print?'#111111':'#78559c';let layer=`<g id="profection-layer" data-house="${r.activatedHouse}" data-sign="${r.activatedSignIndex}"><title>${esc(r.method)}: ${r.activatedSign}; casa ${r.activatedHouse}; ${r.lordOfYear}. Posiciones simbólicas.</title>`;
 const vertices=Array.from({length:31},(_,i)=>point(start+i,asc,485));layer+=`<polyline points="${vertices.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="${ink}" stroke-width="12" stroke-opacity=".5"/>`;
 const mid=point(start+15,asc,515);layer+=outlinedText(`P ${r.activatedHouse} ${r.lordOfYear}`,mid.x,mid.y,12,ink);
 // Marcadores dentro del círculo de aspectos; etiquetas separadas por índice.
 const placements=layoutBodies(r.profectedPoints.map((p,i)=>({name:String(i+1),longitude:p.longitude,position:p.position,motion:''})),asc);
 for(const [i,p] of r.profectedPoints.entries()){const v=point(p.longitude,asc,180),label=placements.find(l=>l.name===String(i+1))!,pos={x:550+(label.x-550)*.48,y:550+(label.y-550)*.48};layer+=`<g data-profected-id="${esc(p.id)}" data-longitude="${p.longitude}"><title>${esc(p.name+' · '+p.label+': '+p.position)}</title><line x1="${v.x}" y1="${v.y}" x2="${pos.x}" y2="${pos.y}" stroke="${ink}" stroke-dasharray="3 3"/><path d="M ${v.x} ${v.y-5} l 5 5 -5 5 -5 -5 Z" fill="white" stroke="${ink}"/>${outlinedText('P'+(i+1),pos.x,pos.y,13,ink)}</g>`;}
 layer+='</g>';return svg.replace('</svg>',layer+'</svg>');}
