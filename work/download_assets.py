import urllib.request, json, pathlib, hashlib
root=pathlib.Path('outputs/dama-del-tiempo')
base='https://raw.githubusercontent.com/aloistr/swisseph/master/'
manifest={}
for remote,local in [('ephe/sepl_18.se1','ephe/sepl_18.se1'),('ephe/semo_18.se1','ephe/semo_18.se1'),('LICENSE','licenses/Swiss-Ephemeris.txt'),('agpl-3.0.txt','LICENSE')]:
    data=urllib.request.urlopen(base+remote,timeout=60).read()
    (root/local).write_bytes(data)
    manifest[local]={'source':base+remote,'sha256':hashlib.sha256(data).hexdigest()}
(root/'ephe/manifest.json').write_text(json.dumps(manifest,indent=2))
wheel_dir=pathlib.Path('work/wheels'); wheel_dir.mkdir(exist_ok=True)
for package,version in [('pyswisseph','2.10.3.2'),('tzdata','2026.2')]:
    meta=json.load(urllib.request.urlopen(f'https://pypi.org/pypi/{package}/{version}/json',timeout=30))
    wheel=next(x for x in meta['urls'] if x['filename'].endswith('cp311-cp311-win_amd64.whl') or x['filename'].endswith('py2.py3-none-any.whl'))
    data=urllib.request.urlopen(wheel['url'],timeout=60).read()
    assert hashlib.sha256(data).hexdigest()==wheel['digests']['sha256']
    (wheel_dir/wheel['filename']).write_bytes(data)
    print(wheel['filename'],flush=True)
print('Archivos oficiales descargados y huellas guardadas.',flush=True)
