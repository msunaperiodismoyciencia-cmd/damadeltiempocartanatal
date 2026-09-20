import {movementLabel} from './aspect-ui.js';
import {angularSeconds,aspectMovement} from './angular.js';
// SVG puro: consume longitudes del resultado existente. AGPL-3.0-only.
import {glyphs,fontLicense} from './glyphs.js';
import {terms} from './dignities.js';
import type {Aspect} from './aspects.js';
export type WheelBody={name:string;longitude:number;position:string;motion:string;speed?:number};
export type HouseSystem={id:string;name:string;code:string};
export type WheelData={house_system:HouseSystem;bodies:WheelBody[];angles:{name:string;longitude:number;position:string}[];cusps:{house:number;longitude:number;position:string}[]};
export type WheelOptions={aspects:boolean;degrees:boolean;cusps:boolean;print:boolean;terms:boolean};
export const defaultOptions:WheelOptions={aspects:true,degrees:true,cusps:true,print:false,terms:true};
export const SIZE=1100,CENTER=550;
export const signs=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
export const bodyGlyphs:Record<string,string>={'Sol':'☉','Luna':'☽','Mercurio':'☿','Venus':'♀','Marte':'♂','Júpiter':'♃','Saturno':'♄','Nodo Norte':'☊','Nodo Sur':'☋'};
export const normalize=(value:number)=>(value%360+360)%360;
export function longitudeToAngle(longitude:number,ascendant:number){return (180-(longitude-ascendant))*Math.PI/180;}
export function point(longitude:number,ascendant:number,radius:number){
 const angle=longitudeToAngle(longitude,ascendant);
 return {x:CENTER+radius*Math.cos(angle),y:CENTER+radius*Math.sin(angle)};
}
export function houseMidpoint(start:number,end:number){return normalize(start+normalize(end-start)/2);}
export type Box={x:number;y:number;width:number;height:number};
export function overlaps(a:Box,b:Box,padding=5){return Math.abs(a.x-b.x)<(a.width+b.width)/2+padding&&Math.abs(a.y-b.y)<(a.height+b.height)/2+padding;}
export type Placement=Box&{name:string;longitude:number;labelLongitude:number;radius:number;anchor:{x:number;y:number}};
export function layoutBodies(bodies:ReadonlyArray<WheelBody>,asc:number):Placement[]{
 const placed:Placement[]=[];
 // Orden estable, incluidos conjuntos exactos y el cruce 359°/0°.
 for(const body of [...bodies].sort((a,b)=>normalize(a.longitude)-normalize(b.longitude)||a.name.localeCompare(b.name))){
  let chosen:Placement|undefined;
  const offsets=[0];for(let offset=3;offset<=180;offset+=3)offsets.push(offset,-offset);
  for(const offset of offsets){
   for(const radius of [304,236]){
    const p=point(body.longitude+offset,asc,radius);
    const candidate:Placement={...p,width:90,height:72,name:body.name,longitude:body.longitude,labelLongitude:normalize(body.longitude+offset),radius,anchor:point(body.longitude,asc,400)};
    if(placed.every(other=>!overlaps(candidate,other))){chosen=candidate;break;}
   }
   if(chosen)break;
  }
  if(!chosen)throw Error('No se pudieron distribuir los glifos sin superposición.');
  placed.push(chosen);
 }
 return placed;
}
const esc=(text:string)=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const f=(n:number)=>Number(n.toFixed(5));
function textWidth(text:string,size:number){return Array.from(text).reduce((sum,char)=>sum+glyphs[char].advance*size/glyphs[char].units,0);}
export function layoutCuspLabels(cusps:WheelData['cusps'],asc:number,mc?:number,showCusps=true){
 const placed:(Box&{house:number;longitude:number;labelLongitude:number;rotation:number;text:string})[]=[];
 const axes=mc===undefined?[]:[{name:'ASC',longitude:asc},{name:'DSC',longitude:normalize(asc+180)},{name:'MC',longitude:mc},{name:'IC',longitude:normalize(mc+180)}];
 const same=(a:number,b:number)=>Math.abs(normalize(a-b+180)-180)<1e-7;
 const items=(showCusps?cusps:[]).map(cusp=>({...cusp,prefix:axes.find(axis=>same(axis.longitude,cusp.longitude))?.name||String(cusp.house)}));
 for(const axis of axes)if(!items.some(item=>same(item.longitude,axis.longitude)))items.push({house:0,longitude:axis.longitude,position:'',prefix:axis.name});
 for(const cusp of items){
  const text=cusp.prefix+' · '+degrees(cusp.longitude),width=textWidth(text,16)+6,height=23;
  let found=false;
  for(let shift=0;shift<=180&&!found;shift+=2)for(const offset of shift?[shift,-shift]:[0]){
   const labelLongitude=cusp.longitude+offset;
   let rotation=normalize(longitudeToAngle(labelLongitude,asc)*180/Math.PI+90);if(rotation>90&&rotation<270)rotation+=180;
   const rad=rotation*Math.PI/180,candidate={...point(labelLongitude,asc,507),width:Math.abs(width*Math.cos(rad))+Math.abs(height*Math.sin(rad)),height:Math.abs(width*Math.sin(rad))+Math.abs(height*Math.cos(rad)),house:cusp.house,longitude:cusp.longitude,labelLongitude,rotation,text};
   if(placed.every(other=>!overlaps(candidate,other,4))){placed.push(candidate);found=true;break;}
  }
  if(!found)throw Error('No se pudieron distribuir las etiquetas de cúspides.');
 }
 return placed;
}
export function outlinedText(text:string,x:number,y:number,size:number,color:string,rotation=0):string{
 // Cada glifo es un trazado: SVG/PNG no dependen de fonts, CSS o red externos.
 const letters=Array.from(text).map(char=>{const glyph=glyphs[char];if(!glyph)throw Error(`Glifo no disponible: ${char}`);return glyph;});
 const width=letters.reduce((total,g)=>total+g.advance*size/g.units,0);
 let advance=-width/2;
 const paths=letters.map(g=>{const scale=size/g.units;const path=`<path d="${g.d}" transform="translate(${f(advance)} ${f(size*.34)}) scale(${f(scale)} ${f(-scale)})"/>`;advance+=g.advance*scale;return path;}).join('');
 return `<g aria-hidden="true" data-label="${esc(text)}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rotation)})" fill="${color}">${paths}</g>`;
}
const line=(a:{x:number;y:number},b:{x:number;y:number},stroke:string,width=1,attrs='')=>`<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="${stroke}" stroke-width="${width}" ${attrs}/>`;
const circle=(radius:number,stroke:string,width=1,fill='none')=>`<circle cx="550" cy="550" r="${radius}" stroke="${stroke}" stroke-width="${width}" fill="${fill}"/>`;
function degrees(longitude:number){const minutes=Math.floor(normalize(longitude)*60+.5)%21600;return `${String(Math.floor(minutes%1800/60)).padStart(2,'0')}°${String(minutes%60).padStart(2,'0')}′`;}
function roundedSign(longitude:number){return signs[Math.floor((Math.floor(normalize(longitude)*60+.5)%21600)/1800)];}
const aspectStyles:Record<string,{color:string;dash:string}>={Conjunción:{color:'#7e6477',dash:''},Sextil:{color:'#16212f',dash:'3 5'},Cuadratura:{color:'#7e6477',dash:'10 4'},Trígono:{color:'#16212f',dash:''},Oposición:{color:'#2e2046',dash:'12 4 2 4'}};

export function renderWheel(data:WheelData,options:WheelOptions,aspects:Aspect[],title='Dama del Tiempo'):string{
 const asc=data.angles.find(a=>a.name==='Ascendente')?.longitude,mc=data.angles.find(a=>a.name==='Medio Cielo')?.longitude;
 if(asc===undefined||mc===undefined||data.cusps.length!==12||!Number.isFinite(asc)||!Number.isFinite(mc))throw Error('Faltan ángulos o cúspides del resultado calculado.');
 if([...data.bodies,...data.cusps].some(b=>!Number.isFinite(b.longitude)))throw Error('Longitud no válida en la carta.');
 const ink=options.print?'#111111':'#16212f',violet=options.print?ink:'#2e2046',muted=options.print?'#444444':'#7e6477',bg=options.print?'#ffffff':'#fffaf0',soft=options.print?'#ffffff':'#f1e9e6';
 const system=data.house_system;
 if(!system?.id||!system.name)throw Error('Falta identificar el sistema de casas del resultado.');
 const description=`${title}. Tropical, geocéntrica, casas ${system.name}. Ascendente a la izquierda; zodíaco antihorario. ${data.bodies.map(b=>`${b.name}: ${b.position}, ${b.motion}`).join('; ')}. ${data.cusps.map(c=>`Casa ${c.house}: ${c.position}`).join('; ')}. Aspectos visibles: ${options.aspects?aspects.map(a=>`${a.from} ${a.name} ${a.to}, orbe ${angularSeconds(a.orb)}`).join('; ')||'ninguno con los orbes definidos':'ocultos'}.`;
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${options.terms?'-75 -75 1250 1250':'0 0 1100 1100'}" width="1100" height="1100" role="img" data-house-system="${esc(system.id)}" aria-labelledby="wheel-title wheel-desc"><title id="wheel-title">${esc(title)} · ${esc(system.name)} · rueda astrológica</title><desc id="wheel-desc">${esc(description)}</desc><metadata>${esc('Glifos Noto Sans / Noto Sans Symbols / Noto Sans Symbols 2, SIL OFL 1.1.\n'+fontLicense)}</metadata><rect x="-75" y="-75" width="1250" height="1250" fill="${bg}"/>`;
 svg+=outlinedText('Dama del Tiempo · '+system.name,550,14,13,ink);
 svg+=circle(480,ink,1.5,soft)+circle(430,ink,1,bg)+circle(400,muted,1)+circle(350,muted,.65)+circle(184,muted,.7);
 for(let sign=0;sign<12;sign++){
  svg+=line(point(sign*30,asc,430),point(sign*30,asc,480),muted,1,`data-sign-boundary="${sign*30}"`);
  const p=point(sign*30+15,asc,457);svg+=outlinedText(signs[sign],p.x,p.y,35,sign%2?violet:ink);
 }
 for(let degree=0;degree<360;degree++){
  const tier=degree%10===0?10:degree%5===0?5:1;
  svg+=line(point(degree,asc,430),point(degree,asc,tier===10?405:tier===5?413:421),ink,tier===10?1.6:tier===5?1:.6,`data-degree="${degree}" data-tier="${tier}"`);
  if(tier===10){const p=point(degree+1.6,asc,414);svg+=outlinedText(String(degree%30),p.x,p.y,11,ink);}
 }
 if(options.cusps){
  const numberBoxes:Box[]=[];
  for(let i=0;i<12;i++){
   const cusp=data.cusps[i],lon=cusp.longitude,mid=houseMidpoint(lon,data.cusps[(i+1)%12].longitude);
   svg+=line(point(lon,asc,184),point(lon,asc,400),muted,.85,`data-cusp="${cusp.house}" data-longitude="${lon}"`);
   let p=point(mid,asc,373);
   for(const r of [373,389,359]){const test={...point(mid,asc,r),width:19,height:17};if(numberBoxes.every(box=>!overlaps(test,box,1))){p=test;break;}}
   numberBoxes.push({...p,width:19,height:17});svg+=outlinedText(String(cusp.house),p.x,p.y,16,ink);
   // Etiqueta externa con su cúspide exacta conectada. No mueve la cúspide.
  }
 }
 for(const label of layoutCuspLabels(data.cusps,asc,mc,options.cusps)){
  svg+=line(point(label.longitude,asc,481),point(label.labelLongitude,asc,493),muted,.8);
  svg+=`<g data-cusp-label="${label.house}">`+outlinedText(label.text,label.x,label.y,16,label.house===0?violet:ink,label.rotation)+'</g>';
 }
 // Ángulos reales; MC/IC no se fuerzan al eje vertical.
 for(const [name,lon] of [['ASC',asc],['DSC',normalize(asc+180)],['MC',mc],['IC',normalize(mc+180)]] as const){
  svg+=line(point(lon,asc,184),point(lon,asc,487),violet,2,`data-axis="${name}" data-longitude="${lon}"`);
 }
 if(options.aspects)for(const aspect of aspects){
  const a=data.bodies.find(b=>b.name===aspect.from),b=data.bodies.find(b=>b.name===aspect.to);if(!a||!b)continue;
  const style=aspectStyles[aspect.name];if(!style)continue;
  const p=point(a.longitude,asc,181),q=point(b.longitude,asc,181),color=options.print?ink:style.color;
  svg+=`<g data-aspect="${esc(aspect.name)}" data-aspect-from="${esc(aspect.from)}" data-aspect-to="${esc(aspect.to)}"><title>${esc(`${aspect.from} – ${aspect.to}: ${aspect.name}; orbe ${angularSeconds(aspect.orb)}; ${movementLabel(aspectMovement(a,b,aspect.angle))}`)}</title>`;
  if(aspect.angle===0){
   const mid=normalize(a.longitude+((b.longitude-a.longitude+540)%360-180)/2),m=point(mid,asc,175);
   svg+=line(p,q,color,2)+`<circle cx="${f(m.x)}" cy="${f(m.y)}" r="5" fill="none" stroke="${color}" stroke-width="2"/>`;
  }else svg+=line(p,q,color,1.4,`stroke-dasharray="${style.dash}"`);
  svg+='</g>';
 }
 const placed=layoutBodies(data.bodies,asc);
 // Conectores detrás de las etiquetas. Las marcas exactas nunca se desplazan.
 for(const placement of placed){const p=placement.anchor;svg+=`<g data-body-anchor="${esc(placement.name)}" data-longitude="${placement.longitude}">`+line(p,point(placement.longitude,asc,346),muted,.9)+line(point(placement.longitude,asc,346),placement,muted,.9)+`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="2.5" fill="${ink}"/></g>`;}
 for(const p of placed){
  const body=data.bodies.find(b=>b.name===p.name)!;
  svg+=`<g data-planet="${esc(body.name)}" data-longitude="${body.longitude}" data-label-longitude="${p.labelLongitude}"><title>${esc(`${body.name}: ${body.position}, ${body.motion}. La línea apunta a su longitud exacta.`)}</title><rect x="${f(p.x-45)}" y="${f(p.y-36)}" width="90" height="72" rx="7" fill="${bg}"/>`;
  svg+=outlinedText(bodyGlyphs[body.name]||'?',p.x-8,p.y-12,34,violet);
  if(body.motion==='Retrógrado')svg+=outlinedText('℞',p.x+23,p.y-10,17,ink);
  if(options.degrees){svg+=outlinedText(degrees(body.longitude),p.x-5,p.y+19,17,ink)+outlinedText(roundedSign(body.longitude),p.x+34,p.y+19,16,muted);}
  svg+='</g>';
 }
 if(options.terms)svg+=renderTerms(asc,ink,muted,bg);
 return svg+'</svg>';
}


export function termLabel(sign:number,index:number){const row=terms.intervals[sign],t=row.segments[index];return `${row.sign}: [${t.start}°, ${t.end}°), ${t.ruler}. Sistema: ${terms.system}. Fuente: ${terms.source}. ${terms.reference}`;}
export function termGeometry(asc:number){return terms.intervals.flatMap((row,sign)=>row.segments.map((t,index)=>({sign,index,...t,startLongitude:sign*30+t.start,endLongitude:sign*30+t.end,label:point(sign*30+(t.start+t.end)/2,asc,572),boundary:point(sign*30+t.start,asc,595)})));}
function renderTerms(asc:number,ink:string,muted:string,bg:string){
 let result=`<g data-terms-system="${esc(terms.system)}" data-terms-version="${terms.version}">`;
 for(const t of termGeometry(asc)){
  const a=point(t.startLongitude,asc,545),b=point(t.startLongitude,asc,605),c=point(t.endLongitude,asc,605),d=point(t.endLongitude,asc,545);
  const path=`M ${f(a.x)} ${f(a.y)} L ${f(b.x)} ${f(b.y)} A 605 605 0 0 0 ${f(c.x)} ${f(c.y)} L ${f(d.x)} ${f(d.y)} A 545 545 0 0 1 ${f(a.x)} ${f(a.y)} Z`;
  const label=termLabel(t.sign,t.index);
  result+=`<g tabindex="0" role="button" data-term="${t.sign}-${t.index}" data-start="${t.startLongitude}" data-end="${t.endLongitude}" data-ruler="${esc(t.ruler)}" aria-label="${esc(label)}"><title>${esc(label)}</title><path d="${path}" fill="${bg}" stroke="${muted}" stroke-width="0.8"/>`;
  result+=outlinedText(bodyGlyphs[t.ruler],t.label.x,t.label.y,20,ink);
  let rotation=normalize(longitudeToAngle(t.startLongitude,asc)*180/Math.PI+90);if(rotation>90&&rotation<270)rotation+=180;
  result+=outlinedText(String(t.start)+'°',t.boundary.x,t.boundary.y,10,ink,rotation)+'</g>';
 }
 return result+'</g>';
}

export function downloadSvg(svg:string){downloadBlob(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),'dama-del-tiempo.svg');}
export function downloadBlob(blob:Blob,filename:string){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function pngBlob(svg:string,size=3300):Promise<Blob>{
 const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
 try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo preparar la imagen.');ctx.drawImage(image,0,0,size,size);return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo generar PNG.')),'image/png'));}finally{URL.revokeObjectURL(url);}
}
