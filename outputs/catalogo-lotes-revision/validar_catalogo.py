"""Checks of the review dataset only. No astrological calculation engine."""
from pathlib import Path
import unittest,json,re,csv,collections,hashlib
B=Path(__file__).resolve().parent
read=lambda name:json.loads((B/name).read_text(encoding='utf-8'))
C=read('catalogo.json');R=C['records'];RAW=read('filas-originales.json');F=read('fuentes.json');S=read('resumen-validacion.json')
N=lambda s:''.join(s.split()).replace('ⓘ','')

class CatalogAudit(unittest.TestCase):
 def test_01_all_rows_and_cells(self):
  self.assertEqual(len(R),335);self.assertEqual(len(RAW),335)
  self.assertEqual([r['sourceRow']['row'] for r in R],list(range(1,336)))
  for r,raw in zip(R,RAW):
   self.assertEqual(list(r['sourceCells'].values()),raw['raw']);self.assertEqual(len(raw['raw']),9)
   self.assertEqual(N(r['nameOriginal']+r['alternativeNamesRaw']),N(raw['raw'][0]))
 def test_02_ids_and_original_names_unique(self):
  self.assertEqual(len({r['id'] for r in R}),335)
  self.assertEqual(len({r['nameOriginal'].casefold() for r in R}),335)
 def test_03_translations_alignment(self):
  self.assertEqual([r['nameSpanish'] for r in R],(B/'nombres-es.txt').read_text(encoding='utf-8').splitlines())
  for n,name in [(1,'Acusación (Firmicus)'),(111,'Fortuna'),(183,'Hijos varones (Valens)'),(184,'Trabajadores manuales y actividades comerciales'),(288,'Espíritu'),(335,'Trabajo que debe hacerse')]:self.assertEqual(R[n-1]['nameSpanish'],name)
 def test_04_statuses_and_pending_approval(self):
  allowed={'verified','multiple_sources','dubious','conflicting_sources','unsupported_operand','conditional','pending_review'}
  for r in R:
   self.assertIn(r['status'],allowed);self.assertNotEqual(r['status'],'verified');self.assertFalse(r['enabledByDefault']);self.assertEqual(r['extractionReview'],'pending_user_review')
 def test_05_warning_marks_exact(self):
  self.assertEqual(sum(r['flags']['dubious'] for r in R),31)
  self.assertEqual(sum(r['flags']['multipleSources'] for r in R),14)
  self.assertTrue(R[149]['flags']['dubious']) # PDF prints Dub without period.
  for r in R:
   self.assertEqual(r['flags']['dubious'],bool(re.search(r'\bDub\.?',r['sourceCells']['annotations'])))
   self.assertEqual(r['flags']['multipleSources'],'Mult.' in r['sourceCells']['annotations'])
 def test_06_no_unconditional_reversal_of_special_rules(self):
  self.assertEqual(sum(r['reverseAtNight'] is True for r in R),183)
  for r in R:
   if r['reverseNocturnalRaw'] not in ('','reverse','day','night'):
    self.assertIsNone(r['reverseAtNight']);self.assertIsNone(r['dayFormula']);self.assertIsNone(r['nightFormula'])
  self.assertEqual(R[21]['reverseNocturnalRaw'],'reverse (MSL, MSP, MSV, GI, Q, R), always below horizon (VV)')
  self.assertEqual(R[38]['reverseNocturnalRaw'],'always below horizon')
  self.assertEqual(R[139]['reverseNocturnalRaw'],'use both')
 def test_07_sect_restrictions_preserved(self):
  self.assertEqual(R[94]['sectRestriction'],'day');self.assertEqual(R[95]['sectRestriction'],'night')
  self.assertEqual(R[187]['reverseNocturnalRaw'],'day (AO)');self.assertEqual(R[190]['reverseNocturnalRaw'],'night (AO)')
  for n in [232,233]:self.assertEqual(R[n-1]['reverseNocturnalRaw'],'');self.assertIsNone(R[n-1]['dayFormula'])
 def test_08_formula_templates_match_operands(self):
  for r in R:
   p,s,t=[r[k]['raw'] for k in ['personalPoint','significator','trigger']]
   self.assertEqual(r['baseFormulaAsPrinted']['add'],[p,s]);self.assertEqual(r['baseFormulaAsPrinted']['subtract'],t)
   if r['dayFormula']:self.assertEqual(r['dayFormula']['add'],[p,s]);self.assertEqual(r['dayFormula']['subtract'],t)
   if r['nightFormula']:
    self.assertEqual(r['nightFormula']['add'],[p,t if r['reverseAtNight'] else s]);self.assertEqual(r['nightFormula']['subtract'],s if r['reverseAtNight'] else t)
 def test_09_seven_initial_rows_exact_pdf(self):
  expected={111:('Asc','Moon','Sun','DS'),288:('Asc','Sun','Moon','VV'),90:('Asc','Venus','Spirit','PA'),206:('Asc','Fortune','Mercury','PA'),51:('Asc','Fortune','Mars','PA'),320:('Asc','Jupiter','Spirit','PA'),211:('Asc','Fortune','Saturn','PA')}
  self.assertEqual({r['sourceRow']['row'] for r in R if r['proposedDefaultSelected']},set(expected))
  for n,values in expected.items():
   r=R[n-1];self.assertEqual(tuple(r[k]['raw'] for k in ['personalPoint','significator','trigger'])+(r['primarySource'],),values);self.assertIs(r['reverseAtNight'],True)
 def test_10_operand_inventory_and_unresolved_positions(self):
  self.assertEqual(sum(r['flags']['unsupportedOperand'] for r in R),17)
  for r in R:
   for k in ['personalPoint','significator','trigger']:
    op=r[k];self.assertEqual(op['raw'],' '.join(r['sourceCells'][k].split()))
    if op['type']=='fixed_zodiac_degree':
     if op['degreeAsPrinted']:
      self.assertIsNone(op['absoluteLongitude']);self.assertEqual(op['support'],'unsupported')
     else:self.assertEqual(op['absoluteLongitude'],{'Gemini':60,'Leo':120,'Virgo':150}[op['sign']])
   if r['flags']['unsupportedOperand']:self.assertIsNone(r['dayFormula']);self.assertIsNone(r['nightFormula'])
 def test_11_dependencies_reference_explicit_rows(self):
  ids={r['id'] for r in R}
  for r in R:
   self.assertTrue(set(r['dependencies'])<=ids)
   self.assertEqual(set(r['dependencies']),{r[k]['lotId'] for k in ['personalPoint','significator','trigger'] if r[k]['type']=='lot'})
  self.assertEqual(R[206]['dependencies'],['lusby-traditional-0093'])
 def test_12_sources_not_invented(self):
  self.assertEqual(F['unresolvedCodes'],['AO','HT','M','RB'])
  self.assertEqual(len(F['entries']),40)
  raw=F['rawSourceSection']
  for code,s in F['entries'].items():
   self.assertIn(code+':',raw)
   if 'rawEntry' in s:self.assertIn(s['rawEntry'],raw)
  self.assertEqual(R[287]['secondarySources'][0],'VV')
  self.assertEqual(R[81]['secondarySources'],['O2','MSL','MSP','MSV','GI','Q'])
 def test_13_categories_not_inferred(self):
  for r in R:self.assertEqual(r['categories'],[s.strip() for s in ' '.join(r['sourceCells']['category'].split()).split(',')])
  self.assertNotIn('Hermetic',R[89]['categories']);self.assertNotIn('Hermetic',R[205]['categories']);self.assertIn('Mundane',R[319]['categories'])
  self.assertFalse(any('Natal' in r['contexts'] for r in R))
 def test_14_unavailable_tooltips_not_reconstructed(self):
  self.assertEqual(sum(r['flags']['informationMarker'] for r in R),70)
  for r in R:
   if r['flags']['informationMarker']:self.assertTrue(any('no contiene el texto' in n for n in r['notes']))
 def test_15_csv_matches_json(self):
  with (B/'catalogo.csv').open(encoding='utf-8-sig',newline='') as source:data=list(csv.reader(source))
  self.assertEqual(len(data),336)
  for row,r in zip(data[1:],R):self.assertEqual(row[1:4],[r['id'],r['nameSpanish'],r['nameOriginal']]);self.assertEqual(row[5:8],[r[k]['raw'] for k in ['personalPoint','significator','trigger']])
 def test_16_html_embedded_data_identical(self):
  text=(B/'catalogo.html').read_text(encoding='utf-8')
  payload=json.loads(re.search(r'<script id="data" type="application/json">(.*?)</script>',text,re.S)[1])
  self.assertEqual(payload['catalog'],C);self.assertEqual(payload['sources'],F)
  self.assertNotRegex(text,r'<(?:script|link|img)[^>]+(?:src|href)="https?://')
 def test_17_row_provenance(self):
  previous=0
  for r in R:
   source=r['sourceRow'];self.assertEqual(source['page'],1)
   x0,y0,x1,y1=source['bboxPoints'];self.assertGreaterEqual(y0,previous-.01);self.assertGreater(x1,x0);self.assertGreater(y1,y0);previous=y1
 def test_18_no_variant_merging(self):
  dup=read('duplicados-y-variantes.json');self.assertEqual(len(dup['candidateNameFamilies']),59)
  for g in dup['candidateNameFamilies']:self.assertGreater(len(g['records']),1)
  self.assertEqual([R[n-1]['nameOriginal'] for n in [89,90,91,92,93]],['Eros (Firmicus)','Eros (Hermetic)','Eros (Olympiodorus) A','Eros (Olympiodorus) B','Eros (Valens)'])
 def test_19_summary_matches_records(self):
  self.assertEqual(S['statuses'],dict(collections.Counter(r['status'] for r in R)))
  self.assertEqual(S['specialConditionsTotal'],sum(r['flags']['specialCondition'] for r in R))
  self.assertEqual(S['rowsWithUnresolvedSources'],sum(bool(r['unresolvedSourceCodes']) for r in R))
 def test_20_manuscript_marks_have_printed_definitions(self):
  for r in R:
   for m in r['manuscriptVariants']:self.assertIn(m,F['manuscriptNotes'])

if __name__=='__main__':unittest.main(verbosity=2)
