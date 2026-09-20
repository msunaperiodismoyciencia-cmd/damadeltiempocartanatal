"""Extract the printed table and styled names, offline. Requires pdfplumber."""
from pathlib import Path
import argparse,json,hashlib
import pdfplumber

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pdf',required=True)
parser.add_argument('--out',default=str(Path(__file__).resolve().parent))
args=parser.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
with pdfplumber.open(args.pdf) as doc:
 if len(doc.pages)!=1:raise ValueError('Esta extracción auditada corresponde al PDF de una sola página.')
 p=doc.pages[0]
 matches=[t for t in p.find_tables() if len(t.rows)==337 and len(t.extract()[-1])==9]
 if len(matches)!=1:raise ValueError('La tabla cambió; revisar estructura antes de extraer.')
 t=matches[0];records=[]
 for n,(row,cells) in enumerate(zip(t.extract()[2:],t.rows[2:]),1):
  c=p.crop(cells.cells[0])
  # Join wrapped al- names; other whitespace is normalized only.
  norm=lambda s:' '.join((s or '').replace('-\n','-').split())
  name=norm(c.filter(lambda x:'Bold' in x.get('fontname','')).extract_text())
  alt=norm(c.filter(lambda x:'Italic' in x.get('fontname','')).extract_text())
  records.append({'row':n,'name':name,'alt':alt,'raw':row,'bbox':cells.bbox})
 (out/'filas-originales.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (out/'transcripcion-pdf.txt').write_text(p.extract_text(),encoding='utf-8')
 print('335 filas extraídas. SHA-256:',hashlib.sha256(Path(args.pdf).read_bytes()).hexdigest())
