// Catálogo local y motor de lotes; no modifica la carta astronómica. AGPL-3.0-only.
import data from './data/lots-catalog.json' with {type:'json'};
import bibliography from './data/lots-sources.json' with {type:'json'};
import {rulerships,normalizeLongitude,type Sect} from './dignities.js';
export type Operand={raw:string;type:string;labelSpanish:string;support:string;reason?:string|null;key?:string;lotId?:string;house?:number;angle?:string;planet?:string;absoluteLongitude?:number|null;degreeConvention?:string};
export type Lot={id:string;nameOriginal:string;nameSpanish:string;alternativeNames:string[];personalPoint:Operand|null;significator:Operand|null;trigger:Operand|null;reverseAtNight:boolean|null;sectRestriction:string|null;conditionalRule:unknown;primarySource:string;secondarySources:string[];categories:string[];categoriesSpanish:string[];contexts:string[];dependencies:string[];status:string;notes:string[];unresolvedSourceCodes:string[];flags:{dubious:boolean;multipleSources:boolean;unsupportedOperand:boolean};proposedDefaultSelected:boolean;sourceRow:{row:number};reverseNocturnalRaw:string};
export const catalog=data.records as unknown as Lot[];
export const lotSources=bibliography.entries as Record<string,{name:string;references:string[]}>;
export const catalogVersion=data.catalogVersion;
export const sourceDocument=data.sourceDocument;
export const defaultLots=[111,288,90,206,51,320,211].map(n=>`lusby-traditional-${String(n).padStart(4,'0')}`);
export const houseNames:Record<string,string>={alcabitius:'Alcabitius',regiomontanus:'Regiomontanus',placidus:'Placidus',whole_sign:'Signos enteros'};
export type LotChart={sect:Sect;activeSystem:string;bodies:{name:string;longitude:number}[];angles:{name:string;longitude:number}[];houses:Record<string,{cusps:number[];error?:string}>};
export type LotPolicy={context:string;allowDubious:boolean};
export type LotResult={id:string;ok:boolean;reason?:string;longitude?:number;position?:string;absolute?:string;ruler?:string;houses?:Record<string,number|null>;houseErrors?:Record<string,string>;formula?:string;operands?:{label:string;longitude:number}[];sect:Sect;source:string;sourceRow:number;warnings:string[]};
const planetNames:Record<string,string>={Sun:'Sol',Moon:'Luna',Mercury:'Mercurio',Venus:'Venus',Mars:'Marte',Jupiter:'Júpiter',Saturn:'Saturno'};
export const normalize360=normalizeLongitude;
export function zodiacPosition(value:number){const total=Math.floor(normalize360(value)*60+.5)%21600;return `${rulerships.intervals[Math.floor(total/1800)].sign} ${Math.floor(total%1800/60)}°${String(total%60).padStart(2,'0')}′`;}
export function absolutePosition(value:number){const total=Math.floor(normalize360(value)*60+.5)%21600;return `${Math.floor(total/60)}°${String(total%60).padStart(2,'0')}′`;}
export function rulerAt(value:number){return rulerships.intervals[Math.floor(normalize360(value)/30)].domicile;}
export function houseAt(value:number,cusps:number[]){
 if(cusps.length!==12||cusps.some(x=>!Number.isFinite(x)))throw Error('Faltan las doce cúspides válidas.');
 const widths=cusps.map((c,i)=>normalize360(cusps[(i+1)%12]-c));
 if(widths.some(w=>w<=1e-9)||Math.abs(widths.reduce((a,b)=>a+b,0)-360)>1e-6)throw Error('Cúspides no consecutivas.');
 const lon=normalize360(value),i=cusps.findIndex((c,i)=>normalize360(lon-c)<widths[i]);if(i<0)throw Error('No se pudo asignar casa.');return i+1;
}
export function compatibleContext(r:Lot,context:string){
 if(context==='Natal')return r.proposedDefaultSelected||r.contexts.length===0||r.contexts.includes('Natal');
 return r.contexts.includes(context);
}
export function unavailableReason(r:Lot,chart:LotChart,policy:LotPolicy,dependency=false){
 if(!dependency&&!compatibleContext(r,policy.context))return 'No corresponde al contexto activo; elegí el contexto de esta fórmula.';
 if(r.flags.dubious&&!policy.allowDubious)return 'Fórmula Dub. desactivada. Requiere activar “Mostrar fórmulas dudosas”.';
 if(r.unresolvedSourceCodes.length)return 'Fuente pendiente de identificación: '+r.unresolvedSourceCodes.join(', ')+'.';
 if(r.conditionalRule||r.reverseAtNight===null)return 'Condición pendiente de validación: '+(r.reverseNocturnalRaw||r.nameOriginal)+'.';
 if(r.sectRestriction==='day'&&chart.sect!=='diurna')return 'Solo se utiliza en carta diurna.';
 if(r.sectRestriction==='night'&&chart.sect!=='nocturna')return 'Solo se utiliza en carta nocturna.';
 for(const op of [r.personalPoint,r.significator,r.trigger]){
  if(!op)return 'La fuente tiene un operando vacío.';
  if(op.support==='unsupported')return `${op.raw}: ${op.reason||'operando pendiente de validación.'}`;
 }
 return null;
}
// Revisa el grafo y los insumos, sin calcular centenares de longitudes al abrir la carta.
export function assessLots(chart:LotChart,policy:LotPolicy,records:Lot[]=catalog):LotResult[]{
 const index=new Map(records.map(r=>[r.id,r]));
 const inspect=(id:string,path:Set<string>,dependency=false):string|null=>{
  const r=index.get(id);if(!r)return 'Dependencia inexistente: '+id;if(path.has(id))return 'Dependencia circular: '+id;
  if(chart.sect!=='diurna'&&chart.sect!=='nocturna')return 'Falta secta calculada respecto del horizonte.';
  const blocked=unavailableReason(r,chart,policy,dependency);if(blocked)return blocked;
  const next=new Set(path).add(id);
  for(const dep of r.dependencies){const error=inspect(dep,next,true);if(error)return error;}
  for(const op of [r.personalPoint!,r.significator!,r.trigger!]){
   if(op.type==='lot'){const error=inspect(op.lotId||'',next,true);if(error)return error;continue;}
   if(op.type==='fixed_zodiac_degree'){if(op.degreeConvention!=='zero_origin'||!Number.isFinite(op.absoluteLongitude))return 'Grado fijo pendiente.';continue;}
   let longitude:number|undefined;
   if(op.type==='planet'||op.type==='planet_ruler'||op.type==='lunar_node')longitude=chart.bodies.find(b=>b.name===(op.type==='lunar_node'?'Nodo Norte':planetNames[op.key||op.planet||'']))?.longitude;
   else if(op.type==='angle'||op.type==='angle_ruler'){
    const key=op.key||op.angle;longitude=chart.angles.find(a=>a.name===((key==='Asc'||key==='Dsc')?'Ascendente':'Medio Cielo'))?.longitude;
    if(longitude!==undefined&&(key==='Dsc'||key==='IC'))longitude=normalize360(longitude+180);
   }else if(op.type==='house_cusp'||op.type==='house_ruler'){
    const h=chart.houses[chart.activeSystem];if(!h||h.error)return h?.error||'Casas no disponibles.';longitude=h.cusps[(op.house||0)-1];
   }else return 'Operando no compatible: '+op.raw;
   if(longitude===undefined||!Number.isFinite(longitude))return 'Falta posición: '+op.raw;
   if(op.type.endsWith('_ruler')&&!chart.bodies.some(b=>b.name===rulerAt(longitude)&&Number.isFinite(b.longitude)))return 'Falta posición del regente: '+op.raw;
  }
  return null;
 };
 return records.map(r=>{const reason=inspect(r.id,new Set());return {id:r.id,ok:!reason,reason:reason||undefined,sect:chart.sect,source:r.primarySource,sourceRow:r.sourceRow.row,warnings:r.notes};});
}
// DFS con estados por ID: una dependencia fallida nunca se sustituye por cero.
export function calculateLots(ids:string[],chart:LotChart,policy:LotPolicy,records:Lot[]=catalog):LotResult[]{
 const index=new Map(records.map(r=>[r.id,r])),memo=new Map<string,LotResult>(),visiting=new Set<string>();
 const finite=(n:number|undefined,label:string)=>{if(n===undefined||!Number.isFinite(n))throw Error('Falta una longitud válida: '+label);return normalize360(n);};
 const body=(name:string)=>finite(chart.bodies.find(b=>b.name===name)?.longitude,name);
 const angle=(key:string):number=>{if(key==='Dsc')return normalize360(angle('Asc')+180);if(key==='IC')return normalize360(angle('MC')+180);const name=key==='Asc'?'Ascendente':key==='MC'?'Medio Cielo':key;return finite(chart.angles.find(a=>a.name===name)?.longitude,name);};
 const cusp=(n:number|undefined)=>{if(!n||n<1||n>12)throw Error('Número de casa inválido.');const h=chart.houses[chart.activeSystem];if(!h||h.error)throw Error(h?.error||'Casas del sistema activo no disponibles.');return finite(h.cusps[n-1],'cúspide '+n);};
 const resolve=(o:Operand):number=>{
  if(o.support==='unsupported')throw Error(o.reason||'Operando no compatible.');
  switch(o.type){
   case 'planet':return body(planetNames[o.key!]||o.key!);
   case 'lunar_node':return body('Nodo Norte');
   case 'angle':return angle(o.key!);
   case 'house_cusp':return cusp(o.house);
   case 'house_ruler':return body(rulerAt(cusp(o.house)));
   case 'angle_ruler':return body(rulerAt(angle(o.angle!)));
   case 'planet_ruler':return body(rulerAt(body(planetNames[o.planet!]||o.planet!)));
   case 'fixed_zodiac_degree':if(o.degreeConvention!=='zero_origin'||o.absoluteLongitude===null)throw Error('Convención de grado fijo no resuelta.');return finite(o.absoluteLongitude,'grado fijo');
   case 'lot':{if(!o.lotId)throw Error('Dependencia sin identificar.');const v=visit(o.lotId,true);if(!v.ok)throw Error('Dependencia no disponible: '+(index.get(o.lotId)?.nameSpanish||o.lotId)+'. '+v.reason);return finite(v.longitude,o.raw);}
   default:throw Error('Operando no compatible: '+o.raw);
  }
 };
 const visit=(id:string,dependency=false):LotResult=>{
  const r=index.get(id),base:LotResult={id,ok:false,sect:chart.sect,source:r?.primarySource||'',sourceRow:r?.sourceRow.row||0,warnings:r?.notes||[]};
  if(!r)return {...base,reason:'Dependencia inexistente: '+id};
  if(!dependency&&!compatibleContext(r,policy.context))return {...base,reason:'Lote fuera del contexto activo.'};
  if(memo.has(id))return memo.get(id)!;
  if(visiting.has(id))return {...base,reason:'Dependencia circular detectada: '+id};
  visiting.add(id);
  let result:LotResult;
  try{
   if(chart.sect!=='diurna'&&chart.sect!=='nocturna')throw Error('Falta secta calculada respecto del horizonte.');
   const reason=unavailableReason(r,chart,policy,dependency);if(reason)throw Error(reason);
   // Incluye dependencias declaradas, además de las referencias en operandos.
   for(const dep of r.dependencies){const v=visit(dep,true);if(!v.ok)throw Error('Dependencia no disponible: '+dep+'. '+v.reason);}
   let operands=[r.personalPoint!,r.significator!,r.trigger!];if(chart.sect==='nocturna'&&r.reverseAtNight)operands=[operands[0],operands[2],operands[1]];
   const values=operands.map(o=>({label:o.labelSpanish,longitude:resolve(o)}));
   const longitude=normalize360(values[0].longitude+values[1].longitude-values[2].longitude),houses:Record<string,number|null>={},houseErrors:Record<string,string>={};
   for(const system of Object.keys(houseNames)){try{const h=chart.houses[system];if(!h||h.error)throw Error(h?.error||'Sistema no disponible.');houses[system]=houseAt(longitude,h.cusps);}catch(e){houses[system]=null;houseErrors[system]=(e as Error).message;}}
   result={...base,ok:true,longitude,position:zodiacPosition(longitude),absolute:absolutePosition(longitude),ruler:rulerAt(longitude),houses,houseErrors,operands:values,formula:`normalizar360(${values[0].label} + ${values[1].label} − ${values[2].label})`};
  }catch(e){result={...base,reason:(e as Error).message};}
  visiting.delete(id);memo.set(id,result);return result;
 };
 return [...new Set(ids)].map(id=>visit(id));
}
export type LotFilter={query:string;category:string;primary:string;secondary:string;allowDubious:boolean;multipleOnly:boolean;calculableOnly:boolean};
export function filterLots(records:Lot[],filter:LotFilter,calculable:Set<string>){
 const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es'),q=norm(filter.query);
 return records.filter(r=>(filter.allowDubious||!r.flags.dubious)&&(!q||norm([r.nameSpanish,r.nameOriginal,...r.alternativeNames].join(' ')).includes(q))&&(!filter.category||r.categories.includes(filter.category))&&(!filter.primary||r.primarySource===filter.primary)&&(!filter.secondary||r.secondarySources.includes(filter.secondary))&&(!filter.multipleOnly||r.flags.multipleSources)&&(!filter.calculableOnly||calculable.has(r.id)));
}
export function lotsCsv(results:LotResult[],records:Lot[]=catalog){const index=new Map(records.map(r=>[r.id,r])),quote=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';return '\ufeff'+[['Nombre','Original','Posición','Longitud absoluta','Alcabitius','Regiomontanus','Placidus','Signos enteros','Regente','Fórmula aplicada','Punto personal','Significador','Disparador','Secta','Primaria','Secundarias','Categorías','Estado','Advertencias'],...results.map(v=>{const r=index.get(v.id);return [r?.nameSpanish,r?.nameOriginal,v.position,v.absolute,...Object.keys(houseNames).map(s=>v.houses?.[s]??v.houseErrors?.[s]??''),v.ruler,v.formula,...['personalPoint','significator','trigger'].map(k=>((r as unknown as Record<string,Operand>)?.[k])?.labelSpanish),v.sect,v.source,r?.secondarySources.join(', '),r?.categories.join(', '),v.ok?r?.status:'No calculado',[v.reason,...v.warnings,...Object.values(v.houseErrors||{})].filter(Boolean).join(' | ')]})].map(row=>row.map(quote).join(',')).join('\r\n');}
