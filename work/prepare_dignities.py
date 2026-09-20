from pathlib import Path
import json,hashlib
root=Path('outputs/dama-del-tiempo')
files={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and not any(s in p.parts for s in ['.venv','node_modules','__pycache__','.git'])}
Path('work/dignities-before.json').write_text(json.dumps(files))
out=root/'src/data';out.mkdir(exist_ok=True)
url='https://www.skyscript.co.uk/essential_dignities.html'
signs=['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis']
def save(name,system,source,reference,rows):
 (out/(name+'.json')).write_text(json.dumps(dict(system=system,source=source,reference=reference,version='1.0.0',boundary='[inicio, fin): comienzo inclusivo, final exclusivo; grados sin redondear',intervals=rows),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
domiciles=['Marte','Venus','Mercurio','Luna','Sol','Mercurio','Venus','Marte','Júpiter','Saturno','Saturno','Júpiter']
exalts={0:('Sol',19),1:('Luna',3),3:('Júpiter',15),5:('Mercurio',15),6:('Saturno',21),9:('Marte',28),11:('Venus',27)}
rows=[]
for i,s in enumerate(signs):
 e=exalts.get(i);f=exalts.get((i+6)%12)
 rows.append(dict(sign=s,start=i*30,end=(i+1)*30,domicile=domiciles[i],detriment=domiciles[(i+6)%12],exaltation=dict(planet=e[0],degree=e[1]) if e else None,fall=dict(planet=f[0],degree=f[1]) if f else None,element=['Fuego','Tierra','Aire','Agua'][i%4]))
save('rulerships','Domicilios, exaltaciones, detrimentos y caídas tradicionales','William Lilly, Christian Astrology (1647), p. 104',url,rows)
trips=[('Fuego','Sol','Júpiter','Saturno'),('Tierra','Venus','Luna','Marte'),('Aire','Saturno','Mercurio','Júpiter'),('Agua','Venus','Marte','Luna')]
save('triplicities','Triplicidades de Doroteo','Doroteo, Carmen Astrologicum, I.1; traducción de D. Pingree','https://www.skyscript.co.uk/dorotheus1.pdf',[dict(element=e,day=d,night=n,participant=p,signs=[dict(start=i*30,end=(i+1)*30) for i in range(12) if i%4==j]) for j,(e,d,n,p) in enumerate(trips)])
terms=[ [('Júpiter',6),('Venus',12),('Mercurio',20),('Marte',25),('Saturno',30)], [('Venus',8),('Mercurio',14),('Júpiter',22),('Saturno',27),('Marte',30)], [('Mercurio',6),('Júpiter',12),('Venus',17),('Marte',24),('Saturno',30)], [('Marte',7),('Venus',13),('Mercurio',19),('Júpiter',26),('Saturno',30)], [('Júpiter',6),('Venus',11),('Saturno',18),('Mercurio',24),('Marte',30)], [('Mercurio',7),('Venus',17),('Júpiter',21),('Marte',28),('Saturno',30)], [('Saturno',6),('Mercurio',14),('Júpiter',21),('Venus',28),('Marte',30)], [('Marte',7),('Venus',11),('Mercurio',19),('Júpiter',24),('Saturno',30)], [('Júpiter',12),('Venus',17),('Mercurio',21),('Saturno',26),('Marte',30)], [('Mercurio',7),('Júpiter',14),('Venus',22),('Saturno',26),('Marte',30)], [('Mercurio',7),('Venus',13),('Júpiter',20),('Marte',25),('Saturno',30)], [('Venus',12),('Júpiter',16),('Mercurio',19),('Marte',28),('Saturno',30)]]
def spans(pairs):
 prev=0;out=[]
 for planet,end in pairs:out.append(dict(start=prev,end=end,ruler=planet));prev=end
 return out
save('egyptian-terms','Términos egipcios','Tabla The Egyptian terms, Skyscript; separada de los términos ptolemaicos de Lilly',url,[dict(sign=s,segments=spans(t)) for s,t in zip(signs,terms)])
sequence=['Marte','Sol','Venus','Mercurio','Luna','Saturno','Júpiter']
save('faces','Faces según el orden caldeo','William Lilly, Christian Astrology (1647), p. 104, columna de faces',url,[dict(sign=s,segments=[dict(start=j*10,end=(j+1)*10,ruler=sequence[(i*3+j)%7]) for j in range(3)]) for i,s in enumerate(signs)])
p=root/'tsconfig.json';config=json.loads(p.read_text());config['compilerOptions'].update(module='ESNext',resolveJsonModule=True,allowSyntheticDefaultImports=True,moduleResolution='Bundler');p.write_text(json.dumps(config,indent=2)+'\n')
