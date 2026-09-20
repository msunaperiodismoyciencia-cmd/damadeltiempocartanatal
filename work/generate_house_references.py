import json,subprocess,hashlib
from pathlib import Path
exe=Path('work/swetest64.exe').resolve()
root=Path('outputs/dama-del-tiempo')
cases=[
 {'name':'Greenwich','date':'2000-01-01','time':'12:00:00','latitude':51.4779,'longitude':0},
 {'name':'Buenos Aires','date':'1987-06-15','time':'15:30:00','latitude':-34.6037,'longitude':-58.3816},
 {'name':'Reikiavik','date':'2024-06-21','time':'00:00:00','latitude':64.1466,'longitude':-21.9426},
]
result={'source':'https://github.com/aloistr/swisseph/tree/master/windows/programs','binary_sha256':hashlib.sha256(exe.read_bytes()).hexdigest(),'cases':[]}
for case in cases:
    record={'name':case['name'],'input':{k:v for k,v in case.items() if k!='name'},'systems':{}}
    record['input']['timezone']='Etc/UTC'
    year,month,day=case['date'].split('-')
    for system,code in [('alcabitius','B'),('regiomontanus','R'),('placidus','P'),('whole_sign','W')]:
        args=[str(exe),f'-b{int(day)}.{int(month)}.{year}',f"-utc{case['time']}",'-p0123456m','-eswe',f'-edir{(root/"ephe").resolve()}',f"-house{case['longitude']},{case['latitude']},{code}",'-fPls','-g,','-head']
        output=subprocess.check_output(args,text=True)
        cusps=[];angles={}
        for line in output.splitlines():
            parts=line.split(',')
            if parts[0].strip().startswith('house'):cusps.append(float(parts[1]))
            if parts[0].strip() in ('Ascendant','MC'):angles[parts[0].strip()]=float(parts[1])
        assert len(cusps)==12
        record['systems'][system]={'code':code,'cusps':cusps,'ascendant':angles['Ascendant'],'midheaven':angles['MC'],'output':output,'command':' '.join(args[1:]).replace(str((root/'ephe').resolve()),'./ephe')}
    result['cases'].append(record)
(root/'tests/houses-reference.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('12 referencias oficiales: tres cartas, cuatro sistemas.')
