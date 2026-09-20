"""Genera tres tablas de validación a partir del motor existente. AGPL-3.0-only."""
from pathlib import Path
import json
from server import chart, update_houses
from houses import HOUSE_SYSTEMS
from rules import position

ROOT=Path(__file__).parent
references=json.loads((ROOT/'tests/houses-reference.json').read_text(encoding='utf-8'))
lines=['# Comparación de los cuatro sistemas de casas','',
       'Tres cartas de prueba calculadas con Swiss Ephemeris 2.10.03. Fechas y horas expresadas en UTC, calendario gregoriano, zodíaco tropical y posiciones geocéntricas. Los valores se redondean al minuto más cercano; las pruebas comparan los decimales con swetest oficial (tolerancia 0,000001°).','',
       'En signos enteros cada cúspide comienza a 0° del signo. El Ascendente y el MC conservan sus longitudes astronómicas y no tienen por qué coincidir con las cúspides I y X.','']
for case in references['cases']:
    entry=case['input'];base=chart(entry)
    charts={system:update_houses({'chart':base,'house_system':system}) for system in HOUSE_SYSTEMS}
    lines.extend([f"## {case['name']}",'',f"**{entry['date']} · {entry['time']} UTC**. Latitud {entry['latitude']}°, longitud {entry['longitude']}°.", '',
                  f"Ascendente: **{position(base['astronomy']['ascendant'])}**. Medio Cielo: **{position(base['astronomy']['midheaven'])}**.",'',
                  '| Casa | Alcabitius | Regiomontanus | Placidus | Signos enteros |','|---|---|---|---|---|'])
    for i in range(12):lines.append('| '+str(i+1)+' | '+' | '.join(charts[system]['results']['cusps'][i]['position'] for system in HOUSE_SYSTEMS)+' |')
    lines.extend(['','Distribución de planetas y nodos por casa:','',
                  '| Cuerpo | Alcabitius | Regiomontanus | Placidus | Signos enteros |','|---|---|---|---|---|'])
    for i,body in enumerate(base['results']['bodies']):lines.append('| '+body['name']+' | '+' | '.join(str(charts[system]['results']['bodies'][i]['house']) for system in HOUSE_SYSTEMS)+' |')
    lines.append('')
lines.extend(['## Cómo contrastar con tu programa','',
              '1. Copiá exactamente la fecha UTC y las coordenadas indicadas. Si preferís hora local, comprobá primero que la conversión produzca la misma UTC.',
              '2. Elegí tropical y geocéntrica; cambiá entre Alcabitius, Regiomontanus, Placidus y signos enteros.',
              '3. Compará las doce cúspides y los dos ángulos. Revisá redondeo frente a truncamiento si aparece una diferencia de un minuto.',
              '4. Compará las casas planetarias usando longitud eclíptica, sin regla de los 5°.',
              '5. En la rueda, seguí la línea fina de cada planeta hasta su marca exacta; su glifo puede estar desplazado para que no se superponga.',
              '', 'Las partes tradicionales, Fortuna y Espíritu no están implementados en este proyecto. No se añadieron fórmulas ni se declara validada su respuesta al cambio de sistema.',
              '', 'El contraste con swetest verifica la integración con Swiss Ephemeris, no constituye una validación astronómica independiente. Queda pendiente tu validación en el programa que usás.'])
(ROOT/'COMPARACION-CASAS.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('COMPARACION-CASAS.md: 36 cúspides comparadas en cuatro sistemas y tres tablas de ocupación.')
