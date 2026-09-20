"""Build a review-only catalog from PDF transcription; no longitude calculations."""
from pathlib import Path
import json, re, hashlib, collections, csv, html, shutil, argparse

BASE=Path(__file__).resolve().parent
args=argparse.ArgumentParser(description=__doc__)
args.add_argument('--pdf',default=r'C:\Users\Users\Downloads\Arabic Lots, List of Astrology Arabic Parts Formulas.pdf')
args.add_argument('--out',default=str(BASE if (BASE/'catalogo.json').exists() else Path('outputs/catalogo-lotes-revision').resolve()))
options=args.parse_args()
OUT=Path(options.out).resolve()
OUT.mkdir(parents=True,exist_ok=True)
PDF=Path(options.pdf)
norm=lambda s:' '.join((s or '').split())
dump=lambda name,obj:(OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
raw=json.loads((BASE/('cells.json' if (BASE/'cells.json').exists() else 'filas-originales.json')).read_text(encoding='utf-8'))
translations=(BASE/'nombres-es.txt').read_text(encoding='utf-8').splitlines()
assert len(raw)==len(translations)==335,(len(raw),len(translations))
text=(BASE/('page-01.txt' if (BASE/'page-01.txt').exists() else 'transcripcion-pdf.txt')).read_text(encoding='utf-8')
biblio=text.split('Sources:\n',1)[1].split('\nEric Lusby\n',1)[0]
sources={}
for m in re.finditer(r'^([A-Z][A-Z0-9]*):\n(.*?)(?=^[A-Z][A-Z0-9]*:\n|\Z)',biblio,re.M|re.S):
 code,body=m.groups();extra=None
 if 'Olympiodorus Source Notes' in body:
  body,extra=body.split('Olympiodorus Source Notes',1)
 parts=body.strip().split('• ')
 sources[code]={'code':code,'name':norm(parts[0]),'references':[norm(x) for x in parts[1:]],'rawEntry':body.strip(),'sourceSection':'Sources','sourcePage':1}
 if extra: sources[code]['manuscriptNotesRaw']=extra.strip()
# Nested codes are explicit in the printed bibliography, but not independent books.
for code,name in re.findall(r'^• ([A-Z]+): (.+)$',biblio,re.M):
 sources[code]={'code':code,'name':name,'references':[],'citedIn':'RHG','sourceSection':'Sources / RHG / Sources Cited in Granite','sourcePage':1}
manuscripts={}
for codes,note in re.findall(r'^• ([12][ABL], [12][ABL]) - (.+)$',biblio,re.M):
 for code in codes.split(', '):manuscripts[code]=note
document={'id':'lusby-astroseek-traditional-pdf','filename':PDF.name,'sha256':hashlib.sha256(PDF.read_bytes()).hexdigest(),'pages':1,'pageDimensionsPoints':[1801.9199,17442],'compiler':'Eric Lusby','publisher':'Astro-Seek','printedFilter':'Traditional','tableRows':335,'notice':'El enlace del encabezado anuncia 508 lotes; la tabla adjunta contiene 335. No se añadieron filas ausentes.','externalRequests':0}

PLANETS={'Sun':'Sol','Moon':'Luna','Mercury':'Mercurio','Venus':'Venus','Mars':'Marte','Jupiter':'Júpiter','Saturn':'Saturno'}
ANGLES={'Asc':'Ascendente','Dsc':'Descendente','MC':'Medio Cielo','IC':'Fondo del Cielo'}
SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
SIGNES=['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis']
LOT_IDS={'Fortune':'lusby-traditional-0111','Spirit':'lusby-traditional-0288','Eros (Valens)':'lusby-traditional-0093'}
def operand(value):
 raw=norm(value)
 if not raw:return None
 d={'raw':raw,'type':None,'labelSpanish':raw,'support':'available_chart_data','reason':None}
 if raw in PLANETS:d.update(type='planet',key=raw,labelSpanish=PLANETS[raw])
 elif raw in ANGLES:d.update(type='angle',key=raw,labelSpanish=ANGLES[raw])
 elif raw=='North Node':d.update(type='lunar_node',key='north',labelSpanish='Nodo Norte',policy='Usar el nodo medio o verdadero elegido en la carta; no introducir otro.')
 elif raw in LOT_IDS:d.update(type='lot',lotId=LOT_IDS[raw],labelSpanish={'Fortune':'Fortuna','Spirit':'Espíritu','Eros (Valens)':'Eros (Valens)'}[raw],support='planned_dependency',reason='Dependencia identificada en el catálogo; motor todavía no implementado.')
 elif re.fullmatch(r'\d+(st|nd|rd|th)',raw):d.update(type='house_cusp',house=int(re.match(r'\d+',raw)[0]),labelSpanish='Cúspide '+re.match(r'\d+',raw)[0],houseSystem='active_chart_system')
 elif raw.startswith('Ruler '):
  target=raw[6:]
  if target=='Syzygy':d.update(type='syzygy_ruler',support='unsupported',labelSpanish='Regente de la sizigia',reason='Falta resolver la sizigia y confirmar el criterio de regencia de la fuente.')
  elif target in ANGLES:d.update(type='angle_ruler',angle=target,labelSpanish='Regente de '+ANGLES[target],rulership='traditional_domicile_proposed')
  elif target in PLANETS:d.update(type='planet_ruler',planet=target,labelSpanish='Regente de '+PLANETS[target],rulership='traditional_domicile_proposed')
  elif re.fullmatch(r'\d+(st|nd|rd|th)',target):d.update(type='house_ruler',house=int(re.match(r'\d+',target)[0]),labelSpanish='Regente de casa '+re.match(r'\d+',target)[0],houseSystem='active_chart_system',rulership='traditional_domicile_proposed')
 elif re.fullmatch(r'\d+ [A-Za-z]+',raw):
  deg,sign=raw.split();deg=int(deg)
  d.update(type='fixed_zodiac_degree',sign=sign,degreeAsPrinted=deg,labelSpanish=str(deg)+' '+SIGNES[SIGNS.index(sign)],absoluteLongitude=SIGNS.index(sign)*30 if deg==0 else None,degreeConvention='zero_origin' if deg==0 else 'pending_review')
  if deg:d.update(support='unsupported',reason='Convención de grado ordinal frente a longitud desde cero no explicitada en el PDF; no convertir automáticamente.')
 elif raw=='Lord of Hour':d.update(type='hour_lord',labelSpanish='Señor de la hora',support='unsupported',reason='El proyecto no dispone todavía de un cálculo validado de horas planetarias.')
 elif raw in ('Syzygy','New Moon'):d.update(type='syzygy',kind='unspecified' if raw=='Syzygy' else 'new_moon',labelSpanish='Sizigia' if raw=='Syzygy' else 'Luna nueva',support='unsupported',reason='Falta determinar el evento de referencia y calcular su longitud.')
 elif raw in ('Cancer','Leo'):d.update(type='ambiguous_sign_operand',sign=raw,labelSpanish=SIGNES[SIGNS.index(raw)],support='unsupported',reason='Signo sin grado: no sustituir por 0° ni por su regente.')
 elif raw=='MC of Sun':d.update(type='derived_angle',key='MC_of_Sun',labelSpanish='Medio Cielo del Sol',support='unsupported',reason='Operando sin definición operativa en el PDF; requiere revisión.')
 if d['type'] is None:d.update(type='unresolved',support='unsupported',reason='Operando no identificado inequívocamente.')
 return d

def codes(s):return re.findall(r'\b[A-Z][A-Z0-9]*\b',norm(s))
def formula(p,s,t):return {'operation':'normalize360','add':[p['raw'],s['raw']],'subtract':t['raw'],'expression':f"normalizar360({p['raw']} + {s['raw']} − {t['raw']})"}
cats={'Hellenistic':'Helenística','Medieval':'Medieval','Hermetic':'Hermética','Horary':'Horaria','Mundane':'Mundana','Weather':'Meteorológica','Commodity':'Mercancías','Natal':'Natal'}
records=[]
for row,spanish in zip(raw,translations):
 n=row['row'];c=row['raw'];name=row['name'].replace(' -Chinese',' - Chinese')
 p,s,t=map(operand,c[1:4]);ops=[p,s,t];reverse=norm(c[6]);note=norm(c[8])
 qualified=reverse not in ('','reverse','day','night')
 label_conditions=[]
 if n in (9,10):label_conditions.append({'kind':'planet_in_sign','planet':'Mercury','sign':'Virgo' if n==9 else 'Gemini','origin':'nameOriginal','review':'pending_review'})
 if n in (232,233):label_conditions.append({'kind':'sect_hint_in_name','sect':'day' if n==232 else 'night','origin':'nameOriginal','review':'pending_review','warning':'El nombre indica secta pero la columna Reverse Nocturnal está vacía; no imponer la condición sin revisión.'})
 unknown=sorted(set(codes(c[4])+codes(c[5])+codes(reverse))-set(sources))
 # Named qualifiers remain literal. No mapping of Theophilus/Persians to a bibliography code.
 special={'reverseColumnRaw':reverse,'sourceScopesRaw':re.findall(r'\(([^)]+)\)',reverse),'nameConditions':label_conditions} if qualified or label_conditions else None
 flags={'dubious':bool(re.search(r'\bDub\.?',note)),'multipleSources':bool(re.search(r'\bMult\.',note)),'specialCondition':bool(special),'unsupportedOperand':any(x is None or x['support']=='unsupported' for x in ops),'unresolvedSource':bool(unknown),'informationMarker':'ⓘ' in ''.join(c)}
 review=[]
 if flags['dubious']:review.append('Dub.: fórmula dudosa o fuentes conflictivas según la compilación; desactivada por defecto.')
 if flags['multipleSources']:review.append('Mult.: confirmada en múltiples fuentes según la compilación; no equivale a una comprobación nueva de los textos originales.')
 if flags['informationMarker']:review.append('El PDF muestra ⓘ pero no contiene el texto emergente ni anotaciones con su contenido. No se reconstruyó la nota web.')
 if unknown:review.append('Códigos sin entrada inequívoca en Sources: '+', '.join(unknown)+'. No se expandieron por suposición.')
 if qualified:review.append('Regla nocturna especial: '+reverse+'. Requiere seleccionar y validar su alcance antes de producir una fórmula operativa.')
 if label_conditions:review.append('Condición indicada en el nombre; conservar y revisar por separado de la columna nocturna.')
 for op in ops:
  if op is None:review.append('Operando vacío: la fórmula queda sin resolver.')
  elif op['support']=='unsupported':review.append(op['raw']+': '+op['reason'])
 secondary=codes(c[5]);primary=norm(c[4]) or None
 if n==82:review.append('La celda secundaria imprime “MSV GI” sin coma. Se separan como dos códigos existentes; el texto original permanece conservado.')
 if primary in secondary:review.append('La fuente primaria se repite también como secundaria en el PDF; se conserva sin eliminarla.')
 if n in (179,282,298,308):review.append('Se conserva el nombre inglés del documento, incluidas sus grafías; la traducción es editorial y revisable.')
 if n in (90,206):review.append('La categoría Hermetic no figura en esta fila; “Hermetic” aparece en el nombre. No se agregó a las categorías originales.')
 if n==320:review.append('La fila incluye Mundane. Se mantiene la categoría aunque este lote forma parte de la selección inicial solicitada; confirmar uso natal antes de activarlo en ese contexto.')
 ordinary=not qualified and not label_conditions and not flags['unsupportedOperand']
 base=formula(p,s,t) if all(ops) else None
 day=base if ordinary and reverse!='night' else None
 night=(formula(p,t,s) if reverse=='reverse' else base) if ordinary and reverse!='day' else None
 status='dubious' if flags['dubious'] else 'unsupported_operand' if flags['unsupportedOperand'] else 'pending_review' if unknown else 'conditional' if special or reverse in ('day','night') else 'multiple_sources' if flags['multipleSources'] else 'pending_review'
 categories=[x.strip() for x in norm(c[7]).split(',') if x.strip()]
 deps=[]
 for op in ops:
  if op and op['type']=='lot' and op['lotId'] not in deps:deps.append(op['lotId'])
 records.append({'id':f'lusby-traditional-{n:04}','nameOriginal':name,'nameSpanish':spanish,'translationStatus':'editorial_pending_review','alternativeNames':[a.strip() for a in row['alt'].split(';') if a.strip()],'alternativeNamesRaw':row['alt'],'personalPoint':p,'significator':s,'trigger':t,'baseFormulaAsPrinted':base,'dayFormula':day,'nightFormula':night,'reverseAtNight':None if qualified else reverse=='reverse','sectRestriction':reverse if reverse in ('day','night') else None,'reverseNocturnalRaw':reverse,'conditionalRule':special,'primarySource':primary,'secondarySources':secondary,'unresolvedSourceCodes':unknown,'categories':categories,'categoriesSpanish':[cats[x] for x in categories],'contexts':[x for x in categories if x in ('Natal','Horary','Mundane','Weather','Commodity')],'contextReview':'explicit_pdf_categories_only_no_natal_inference','dependencies':deps,'status':status,'flags':flags,'extractionReview':'pending_user_review','notes':review,'annotationsRaw':note,'manuscriptVariants':re.findall(r'\b[12][ABL]\b',note),'proposedDefaultSelected':n in (111,288,90,206,51,320,211),'enabledByDefault':False,'activationPolicy':'review_required_and_explicit_dubious_opt_in' if flags['dubious'] else 'review_required','sourceDocument':document['id'],'sourceRow':{'page':1,'row':n,'bboxPoints':row['bbox']},'sourceCells':dict(zip(['name','personalPoint','significator','trigger','primary','secondary','reverseNocturnal','category','annotations'],c))})

def groupby(key):
 d=collections.defaultdict(list)
 for r in records:d[key(r)].append(r['id'])
 return [{'key':k,'records':v} for k,v in d.items() if len(v)>1]
def family(r):
 s=re.sub(r'\([^)]*\)','',r['nameOriginal']).strip()
 return re.sub(r'\s+(?:\d+[A-Za-z]?|[ABCabc])$','',s).strip().casefold()
dups={'exactNames':groupby(lambda r:r['nameOriginal'].casefold()),'candidateNameFamilies':groupby(family),'sameOperandTriples':groupby(lambda r:' + '.join([r['personalPoint']['raw'],r['significator']['raw']])+' - '+r['trigger']['raw']),'sameFormulaAndNocturnalRule':groupby(lambda r:' | '.join([r['personalPoint']['raw'],r['significator']['raw'],r['trigger']['raw'],r['reverseNocturnalRaw']])), 'method':'Agrupación para revisión: quitar paréntesis y sufijos de variante del nombre. No fusiona registros ni demuestra equivalencia doctrinal.'}
altindex=collections.defaultdict(list)
for r in records:
 for name in r['alternativeNames']:altindex[name.casefold()].append(r['id'])
dups['repeatedAlternativeNames']=[{'key':k,'records':v} for k,v in altindex.items() if len(v)>1]
opdict={}
for r in records:
 for key in ('personalPoint','significator','trigger'):
  op=r[key]
  if not op:continue
  opdict.setdefault(op['raw'],dict(op,records=[]))['records'].append(r['id'])
for op in opdict.values():op['records']=sorted(set(op['records']))
allunknown=sorted({x for r in records for x in r['unresolvedSourceCodes']})
summary={'rows':len(records),'dubious':sum(r['flags']['dubious'] for r in records),'multipleSources':sum(r['flags']['multipleSources'] for r in records),'unconditionalReverse':sum(r['reverseNocturnalRaw']=='reverse' for r in records),'qualifiedReverse':sum(r['reverseNocturnalRaw'].startswith('reverse') and r['reverseNocturnalRaw']!='reverse' for r in records),'blankReverseColumn':sum(r['reverseNocturnalRaw']=='' for r in records),'dayOnlyUnqualified':sum(r['reverseNocturnalRaw']=='day' for r in records),'nightOnlyUnqualified':sum(r['reverseNocturnalRaw']=='night' for r in records),'dayQualified':sum(r['reverseNocturnalRaw'].startswith('day (') for r in records),'nightQualified':sum(r['reverseNocturnalRaw'].startswith('night (') for r in records),'specialReverseRules':sum(r['reverseNocturnalRaw'] not in ('','reverse','day','night') for r in records),'nameOnlyAdditionalConditions':sum(bool((r['conditionalRule'] or {}).get('nameConditions')) for r in records),'specialConditionsTotal':sum(r['flags']['specialCondition'] for r in records),'unsupportedOperandRows':sum(r['flags']['unsupportedOperand'] for r in records),'unsupportedOperandTypes':len([o for o in opdict.values() if o['support']=='unsupported']),'rowsWithInformationMarker':sum(r['flags']['informationMarker'] for r in records),'unresolvedSourceCodes':allunknown,'rowsWithUnresolvedSources':sum(r['flags']['unresolvedSource'] for r in records),'sources':len(sources),'exactDuplicateNameGroups':len(dups['exactNames']),'candidateVariantGroups':len(dups['candidateNameFamilies']),'sameOperandTripleGroups':len(dups['sameOperandTriples']),'sameFormulaAndRuleGroups':len(dups['sameFormulaAndNocturnalRule']),'statuses':dict(collections.Counter(r['status'] for r in records))}
catalog={'schemaVersion':'0.1.0','catalogVersion':'0.1.0-review.1','reviewStatus':'awaiting_user_review','sourceDocument':document,'formulaConvention':'normalizar360(puntoPersonal + significador − disparador); normalizar360(x) = ((x % 360) + 360) % 360','formulaNotice':'Expresiones simbólicas de la tabla, no código de cálculo. null significa no habilitada por secta, condición o falta de definición. No contiene longitudes calculadas.','sectPolicy':'Sol respecto del horizonte astrológico, no hora civil; pendiente de integración tras aprobación.','supportNotice':'available_chart_data significa que la carta aporta los datos; planned_dependency significa dependencia identificada; unsupported requiere datos o convención adicionales. El motor de lotes aún no está implementado.','records':records}
dump('catalogo.json',catalog)
dump('fuentes.json',{'version':catalog['catalogVersion'],'sourceDocument':document['id'],'entries':sources,'manuscriptNotes':manuscripts,'unresolvedCodes':allunknown,'rawSourceSection':biblio,'transcriptionNotice':'Se conservan grafías y errores impresos. Referencias normalizadas solo en espacios; rawEntry mantiene saltos de línea.'})
dump('operandos.json',list(opdict.values()))
dump('duplicados-y-variantes.json',dups)
dump('resumen-validacion.json',summary)
dump('filas-originales.json',raw)
(OUT/'fuentes-transcripcion.txt').write_text(biblio,encoding='utf-8')
(OUT/'transcripcion-pdf.txt').write_text(text,encoding='utf-8')
for file in ('nombres-es.txt','build_catalog.py'):
 if (BASE/file).resolve()!=(OUT/file).resolve():shutil.copyfile(BASE/file,OUT/file)
with (OUT/'catalogo.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['Fila PDF','ID','Nombre español','Nombre original','Alternativos originales','Punto personal','Significador','Disparador','Fórmula diurna propuesta','Fórmula nocturna propuesta','Reverse Nocturnal literal','Fuente primaria','Fuentes secundarias','Categorías originales','Dub.','Mult.','Variantes manuscritas','Estado','Advertencias'])
 for r in records:w.writerow([r['sourceRow']['row'],r['id'],r['nameSpanish'],r['nameOriginal'],'; '.join(r['alternativeNames']),*[r[k]['raw'] if r[k] else '' for k in ('personalPoint','significator','trigger')],r['dayFormula']['expression'] if r['dayFormula'] else 'Pendiente/no aplicable: ver reglas',r['nightFormula']['expression'] if r['nightFormula'] else 'Pendiente/no aplicable: ver reglas',r['reverseNocturnalRaw'],r['primarySource'],', '.join(r['secondarySources']),', '.join(r['categories']),'Sí' if r['flags']['dubious'] else '', 'Sí' if r['flags']['multipleSources'] else '',', '.join(r['manuscriptVariants']),r['status'],' | '.join(r['notes'])])
print(json.dumps(summary,ensure_ascii=False,indent=2))
