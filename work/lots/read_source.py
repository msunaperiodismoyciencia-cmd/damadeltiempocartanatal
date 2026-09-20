import pdfplumber,json
from pathlib import Path
p=pdfplumber.open(r'C:\Users\Users\Downloads\Arabic Lots, List of Astrology Arabic Parts Formulas.pdf')
print('PAGES',len(p.pages))
for i,page in enumerate(p.pages):
 text=page.extract_text(layout=False) or ''
 Path(f'work/lots/page-{i+1:02}.txt').write_text(text,encoding='utf-8')
 print(i+1,page.width,page.height,len(text),text[:130].replace('\n',' | '))
p.pages[0].to_image(resolution=120).save('work/lots/page-01.png')
