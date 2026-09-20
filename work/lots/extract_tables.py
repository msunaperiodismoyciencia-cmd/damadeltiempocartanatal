import pdfplumber,json
from pathlib import Path
p=pdfplumber.open(r'C:\Users\Users\Downloads\Arabic Lots, List of Astrology Arabic Parts Formulas.pdf').pages[0]
print('LINES',len(p.lines),'RECT',len(p.rects))
tables=p.find_tables()
print('TABLES',[(t.bbox,len(t.rows)) for t in tables])
for i,t in enumerate(tables):
 rows=t.extract();Path(f'work/lots/table-{i}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print(i,str(rows[:3])[:1000])
p.crop((0,150,1600,1000)).to_image(resolution=100).save('work/lots/top.png')
Path('work/lots/words.json').write_text(json.dumps(p.extract_words(),ensure_ascii=False),encoding='utf-8')
