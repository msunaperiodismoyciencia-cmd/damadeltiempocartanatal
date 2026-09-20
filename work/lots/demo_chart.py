import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('outputs/dama-del-tiempo').resolve()))
from server import chart,update_houses
value=chart({'date':'2000-01-01','time':'12:00:00','latitude':51.4779,'longitude':0,'timezone':'Etc/UTC'})
houses={}
for s in ('alcabitius','regiomontanus','placidus','whole_sign'):
 result=update_houses({'chart':value,'house_system':s})
 houses[s]={'cusps':[c['longitude'] for c in result['results']['cusps']]}
Path('work/lots/demo-chart.json').write_text(json.dumps({'chart':value,'houses':houses},ensure_ascii=False),encoding='utf-8')
