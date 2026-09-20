// Presentación de distancias: nunca usar estos textos como entradas de cálculo.
function roundedUnits(value:number,units:number){
 if(!Number.isFinite(value))throw Error('Distancia angular no finita.');
 const scaled=Math.abs(value)*units;
 // Compensa únicamente unas unidades de representación binaria en el empate.
 return Math.round(scaled+Number.EPSILON*Math.max(1,scaled)*2);
}
export function angularMinutes(value:number):string{
 const total=roundedUnits(value,60);
 return `${Math.floor(total/60)}°${String(total%60).padStart(2,'0')}′`;
}
export function angularSeconds(value:number):string{
 const total=roundedUnits(value,3600);
 return `${Math.floor(total/3600)}°${String(Math.floor(total/60)%60).padStart(2,'0')}′${String(total%60).padStart(2,'0')}″`;
}
export const PERFECTION_TOLERANCE=1e-10; // grados, igual a la tolerancia técnica de aspectos
export const RELATIVE_SPEED_TOLERANCE=1e-10; // grados/día; no es el umbral estacionario de un planeta
export type AspectMovement='Aplicante'|'Separativo'|'Partil'|'Indeterminado';
export type MovingBody={longitude:number;speed?:number};
export function aspectMovement(a:MovingBody,b:MovingBody,angle:number):AspectMovement{
 if(![a.longitude,b.longitude,angle].every(Number.isFinite)||angle<0||angle>180)return 'Indeterminado';
 const delta=((b.longitude-a.longitude)%360+540)%360-180;
 const distance=Math.abs(delta),error=distance-angle;
 if(Math.abs(error)<=PERFECTION_TOLERANCE)return 'Partil';
 if(!Number.isFinite(a.speed)||!Number.isFinite(b.speed))return 'Indeterminado';
 const relative=b.speed!-a.speed!;
 if(Math.abs(relative)<=RELATIVE_SPEED_TOLERANCE)return 'Indeterminado';
 // La distancia mínima no es diferenciable en conjunción/oposición.
 // Para otro aspecto en esos puntos no se asigna un sentido instantáneo único.
 if(distance<=PERFECTION_TOLERANCE||180-distance<=PERFECTION_TOLERANCE)return 'Indeterminado';
 const deviationRate=Math.sign(error)*Math.sign(delta)*relative;
 return deviationRate<0?'Aplicante':'Separativo';
}
