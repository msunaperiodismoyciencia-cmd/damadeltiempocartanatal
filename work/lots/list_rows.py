import json,collections
r=json.load(open('work/lots/table-4.json',encoding='utf8'))[2:]
print('ROWS',len(r))
for i,row in enumerate(r): print(i+1,repr(row))
