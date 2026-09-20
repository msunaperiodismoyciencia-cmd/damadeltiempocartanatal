import test from 'node:test';
import assert from 'node:assert/strict';
import {angularMinutes as dm,angularSeconds as dms,aspectMovement as movement,PERFECTION_TOLERANCE} from '../web/angular.js';
import {evaluateAspects} from '../web/aspects.js';
import {renderWheel,defaultOptions} from '../web/wheel.js';
for(const [value,want] of [[15.142576,'15°09′'],[8.5,'8°30′'],[.083333,'0°05′'],[2,'2°00′'],[29.999,'30°00′'],[59.5/60,'1°00′'],[0,'0°00′'],[-8.5,'8°30′'],[179.999,'180°00′']])test(`grados/minutos ${value}`,()=>assert.equal(dm(value),want));
for(const [value,want] of [[15.142576,'15°08′33″'],[8.5,'8°30′00″'],[59.5/3600,'0°01′00″'],[29+59/60+59.9/3600,'30°00′00″']])test(`grados/minutos/segundos ${value}`,()=>assert.equal(dms(value),want));
test('minutos siempre con dos cifras y entradas no finitas rechazadas',()=>{for(let m=0;m<60;m++)assert.equal(dm(2+m/60),`2°${String(m).padStart(2,'0')}′`);for(const n of [NaN,Infinity]){assert.throws(()=>dm(n));assert.throws(()=>dms(n));}});
const body=(longitude,speed)=>({longitude,speed});
for(const [name,a,b,angle,want] of [
 ['acerca por debajo',body(0,1),body(56,2),60,'Aplicante'],
 ['acerca por encima',body(0,2),body(64,1),60,'Aplicante'],
 ['separa por debajo',body(0,2),body(56,1),60,'Separativo'],
 ['separa por encima',body(0,1),body(64,2),60,'Separativo'],
 ['retrogradación',body(0,-2),body(64,-3),60,'Aplicante'],
 ['orden inverso',body(64,-3),body(0,-2),60,'Aplicante'],
 ['cruce Aries',body(359,1),body(1,-.1),0,'Aplicante'],
 ['cruce Aries separando',body(359,-1),body(1,.1),0,'Separativo'],
 ['oposición antes',body(10,0),body(189,1),180,'Aplicante'],
 ['oposición después',body(10,0),body(191,1),180,'Separativo'],
 ['exactitud',body(10,0),body(100,1),90,'Partil'],
 ['exactitud sin velocidades',body(10),body(190),180,'Partil'],
 ['velocidades ausentes',body(10),body(104),90,'Indeterminado'],
 ['velocidades iguales',body(10,1),body(104,1),90,'Indeterminado'],
 ['velocidad casi igual',body(10,1),body(104,1+1e-12),90,'Indeterminado'],
 ['cúspide distancia mínima',body(10,1),body(10,2),60,'Indeterminado'],
 ['velocidad inválida',body(10,NaN),body(104,2),90,'Indeterminado']
])test(`movimiento: ${name}`,()=>assert.equal(movement(a,b,angle),want));
test('partil usa precisión interna, no texto redondeado',()=>{assert.equal(dm(.001),'0°00′');assert.equal(movement(body(0,0),body(90.001,-1),90),'Aplicante');assert.equal(movement(body(0,0),body(90+PERFECTION_TOLERANCE/2,-1),90),'Partil');});
test('velocidades firmadas: comparación con diferencia finita independiente',()=>{for(const angle of [0,60,90,120,180])for(const lon of [1,30,59,61,89,91,119,121,179,181,241,301,359])for(const speed of [-2,2]){const distance=x=>Math.acos(Math.cos(x*Math.PI/180))*180/Math.PI;const before=Math.abs(distance(lon)-angle),after=Math.abs(distance(lon+speed*1e-5)-angle);assert.equal(movement(body(0,0),body(lon,speed),angle),after<before?'Aplicante':'Separativo');}});
test('formato no muta valores ni cambia el límite inclusivo',()=>{const bodies=[{name:'Marte',longitude:10},{name:'Júpiter',longitude:108.5+1/3600}];const all=evaluateAspects(bodies),snapshot=JSON.stringify(all),square=all.find(a=>a.angle===90);assert.equal(square.active,false);assert.equal(dm(square.orb),'8°30′');assert.equal(dm(square.limit),'8°30′');all.forEach(a=>{dm(a.orb);dm(a.separation);dm(a.limit);dms(a.orb);});assert.equal(JSON.stringify(all),snapshot);bodies[1].longitude=108.5;assert.equal(evaluateAspects(bodies).find(a=>a.angle===90).active,true);});
test('SVG exportado usa sexagesimal sin modificar longitudes',()=>{const bodies=[{name:'Marte',longitude:10,speed:.5,position:'Aries 10°00′',motion:'Directo'},{name:'Júpiter',longitude:104+1/3,speed:.1,position:'Cáncer 14°20′',motion:'Directo'}],data={house_system:{id:'whole_sign',name:'Signos enteros',code:'W'},bodies,angles:[{name:'Ascendente',longitude:0,position:''},{name:'Medio Cielo',longitude:270,position:''}],cusps:Array.from({length:12},(_,i)=>({house:i+1,longitude:i*30,position:''}))};const aspects=evaluateAspects(bodies).filter(a=>a.active),snapshot=JSON.stringify({data,aspects});const svg=renderWheel(data,defaultOptions,aspects);assert.ok(svg.includes('4°20′00″'));assert.ok(!svg.includes('semisuma 8°30′'));assert.ok(!svg.includes('separación 94°20′'));assert.ok(svg.includes('Aplicativo'));assert.equal(JSON.stringify({data,aspects}),snapshot);});
