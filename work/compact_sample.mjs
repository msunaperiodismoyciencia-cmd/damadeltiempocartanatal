import {readFileSync,writeFileSync} from 'node:fs';
import {compactAspects,compactCsv,compactHeaders} from '../outputs/dama-del-tiempo/web/aspect-ui.js';
import {evaluateAspects} from '../outputs/dama-del-tiempo/web/aspects.js';
const data=JSON.parse(readFileSync('work/dignities-sample.json')).results;
const rows=compactAspects(evaluateAspects(data.bodies),data.bodies);
writeFileSync('outputs/aspectos-compactos-ejemplo.csv',compactCsv(rows));
console.log(rows.map(r=>r.values.join(' | ')).join('\n'));
