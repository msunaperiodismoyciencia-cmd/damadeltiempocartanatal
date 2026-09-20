from pathlib import Path
import urllib.request,json,hashlib
root=Path('outputs/dama-del-tiempo')
fonts=root/'vendor-sources/fonts';fonts.mkdir(parents=True,exist_ok=True)
base='https://raw.githubusercontent.com/google/fonts/main/ofl/'
manifest={}
for folder,file,target in [('notosanssymbols2','NotoSansSymbols2-Regular.ttf','Symbols.ttf'),('notosans','NotoSans[wdth,wght].ttf','Text.ttf')]:
    url=base+folder+'/'+urllib.parse.quote(file)
    data=urllib.request.urlopen(url,timeout=30).read();(fonts/target).write_bytes(data)
    license=urllib.request.urlopen(base+folder+'/OFL.txt',timeout=30).read()
    (root/'licenses'/f'{folder}-OFL.txt').write_bytes(license)
    manifest[target]={'url':url,'sha256':hashlib.sha256(data).hexdigest()}
(fonts/'manifest.json').write_text(json.dumps(manifest,indent=2))
meta=json.load(urllib.request.urlopen('https://pypi.org/pypi/fonttools/4.61.1/json'))
wheel=next(x for x in meta['urls'] if x['filename'].endswith('py3-none-any.whl'))
data=urllib.request.urlopen(wheel['url']).read();assert hashlib.sha256(data).hexdigest()==wheel['digests']['sha256']
(Path('work')/wheel['filename']).write_bytes(data)
print(wheel['filename'])
