// Capa independiente de lotes; conserva geometría y marcas de la rueda base.
import {point,overlaps,outlinedText,type Box} from './wheel.js';
import {catalog,type LotResult} from './lots.js';
export function layoutLots(values:LotResult[],asc:number){
 const placed:(Box&{id:string;longitude:number;labelLongitude:number;radius:number;index:number})[]=[];
 for(const [index,v] of values.entries()){
  if(!v.ok||v.longitude===undefined)continue;
  let found=false;
  for(let ring=0;ring<10&&!found;ring++)for(let step=0;step<180&&!found;step++)for(const offset of step?[step*2,-step*2]:[0]){
   const radius=640+ring*40,labelLongitude=v.longitude+offset,p={...point(labelLongitude,asc,radius),width:40,height:24,id:v.id,longitude:v.longitude,labelLongitude,radius,index:index+1};
   if(placed.every(b=>!overlaps(p,b,3))){placed.push(p);found=true;break;}
  }
  if(!found)throw Error('No hay espacio para las etiquetas de lotes seleccionadas.');
 }
 return placed;
}
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function appendLots(svg:string,values:LotResult[],asc:number,print=false){
 const valid=values.filter(v=>v.ok);if(!valid.length)return svg;
 const placed=layoutLots(valid,asc),radius=Math.max(...placed.map(p=>p.radius))+30,left=550-radius,width=radius*2,top=left,legendTop=550+radius+30;
 const ink=print?'#111111':'#236158',bg=print?'#ffffff':'#fffaf0';
 let layer=`<g id="lot-layer"><title>Lotes seleccionados; etiquetas desplazadas, longitudes conservadas</title>`;
 for(const p of placed){const anchor=point(p.longitude,asc,610),r=catalog.find(r=>r.id===p.id),v=valid.find(v=>v.id===p.id)!;
  layer+=`<g data-lot-id="${esc(p.id)}" data-longitude="${p.longitude}" data-label-longitude="${p.labelLongitude}"><title>${esc((r?.nameSpanish||p.id)+': '+v.position)}</title><line x1="${anchor.x}" y1="${anchor.y}" x2="${p.x}" y2="${p.y}" stroke="${ink}" stroke-width=".8"/><circle cx="${anchor.x}" cy="${anchor.y}" r="2.5" fill="${ink}"/><rect x="${p.x-20}" y="${p.y-12}" width="40" height="24" rx="4" fill="${bg}"/>${outlinedText('L'+p.index,p.x,p.y,16,ink)}</g>`;
 }
 let y=legendTop;
 for(const p of placed){const r=catalog.find(r=>r.id===p.id),v=valid.find(v=>v.id===p.id)!;
  const text=`L${p.index} · ${r?.nameSpanish||p.id} · ${v.position}`,words=text.split(' '),lines:string[]=[];let line='';
  for(const word of words){if((line+' '+word).length>85){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
  for(const l of lines){layer+=outlinedText(l,550,y,15,ink);y+=23;}
 }
 layer+='</g>';
 const height=y-top+20;
 return svg.replace(/viewBox="[^"]+"/,`viewBox="${left} ${top} ${width} ${height}"`).replace(/(<metadata>[\s\S]*?<\/metadata>)/,`$1<rect x="${left}" y="${top}" width="${width}" height="${height}" fill="${bg}"/>`).replace('</svg>',layer+'</svg>');
}
