import pdfplumber,json
from pathlib import Path
raw=json.loads(Path('work/lots/cells.json').read_text(encoding='utf-8'))
p=pdfplumber.open(r'C:\Users\Users\Downloads\Arabic Lots, List of Astrology Arabic Parts Formulas.pdf').pages[0]
for name,first,last in [('coraje',48,54),('fortuna',104,113),('espiritu',281,292),('especiales',18,23)]:
 p.crop((430,raw[first-1]['bbox'][1],1365,raw[last-1]['bbox'][3])).to_image(resolution=100).save('work/lots/'+name+'.png')
