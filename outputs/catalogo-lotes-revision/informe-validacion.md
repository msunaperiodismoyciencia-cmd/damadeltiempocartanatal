# Catálogo de lotes tradicionales — revisión de extracción

Versión **0.1.0-review.1**. Compilación de **Eric Lusby**, publicada por Astro-Seek y extraída exclusivamente del PDF adjunto. Cada atribución se conserva: no es un sistema doctrinal único. **No se implementó el motor de cálculo ni se modificó Dama del Tiempo.**

## Resultado

| Comprobación | Cantidad |
| --- | --- |
| Filas extraídas | 335 |
| Marca Dub. (incluye Dub sin punto en fila 150) | 31 |
| Marca Mult. | 14 |
| reverse sin condición | 183 |
| reverse con condición o atribución | 37 |
| Columna nocturna vacía | 109 |
| day sin condición | 1 |
| night sin condición | 1 |
| day (AO) | 1 |
| night (AO) | 1 |
| Reglas especiales en columna nocturna | 41 |
| Condiciones adicionales indicadas solo en el nombre | 4 |
| Filas con alguna condición especial (unión) | 45 |
| Filas con operandos aún no resolubles | 17 |
| Operandos distintos aún no resolubles | 12 |
| Nombres principales exactamente duplicados | 0 |
| Grupos candidatos de variantes | 59 |
| Filas con códigos bibliográficos no definidos | 9 |
| Filas con marcador ⓘ sin contenido recuperable | 70 |

El PDF tiene una sola página de gran altura y muestra el filtro **Traditional**. El enlace del encabezado dice “Calculates all 508 Lots at once”; la tabla efectivamente adjunta tiene **335 filas**, además de dos filas de cabecera. No se inventaron las 173 restantes.

Los conteos de marcas, problemas y condiciones son independientes y pueden superponerse. Hay **220 filas que mencionan reverse**, pero solo **183** lo hacen sin calificación. Las otras **37** no deben invertirse globalmente.

Hay un registro `day` y uno `night` sin calificación: Exaltation (Day), fila 95, y Exaltation (Night), fila 96. Además, las filas 188 y 191 dicen `day (AO)` y `night (AO)`; AO no está definido en Sources. Las filas 232 y 233 llevan Day/Night en el nombre, con columna nocturna vacía: quedan pendientes. Los grados fijos de las dos exaltaciones también requieren revisar la convención.

Las **41 reglas nocturnas especiales** incluyen las 37 inversiones calificadas, day (AO), night (AO), always below horizon y use both. Se añaden cuatro condiciones detectadas en los nombres (filas 9, 10, 232, 233), dando **45 filas** a revisar por condiciones.

## Archivos

- `catalogo.html`: todas las filas legibles, búsqueda y filtros locales, con detalle de cada registro.
- `catalogo.csv`: tabla UTF-8 con BOM; conserva caracteres y todas las filas.
- `catalogo.json`: catálogo estructurado, fórmulas simbólicas, operandos tipados, reglas y referencias de fila.
- `fuentes.json`: **34 entradas principales y 6 códigos subordinados a RHG**, con referencias completas del PDF y notas de manuscritos.
- `operandos.json`: inventario de operandos, disponibilidad y filas que los usan.
- `duplicados-y-variantes.json`: agrupaciones para revisión, sin fusionar registros.
- `filas-originales.json`, `transcripcion-pdf.txt`, `fuentes-transcripcion.txt`: transcripciones preservadas.
- `validar_catalogo.py`: controles de extracción y coherencia; no realiza cálculos astrológicos.
- `build_catalog.py`, `make_review.py`, `extraer_pdf.py`, `nombres-es.txt`: reconstrucción auditable.

## Siete lotes iniciales solicitados

Las siguientes expresiones se transcriben de las filas indicadas. En ambos casos se propone aplicar `normalizar360(x) = ((x % 360) + 360) % 360`. Son **fórmulas para aprobación**, no resultados calculados. Las siete filas imprimen `reverse` sin calificación.

| Fila | Nombre español / original | Fuente primaria | Diurna | Nocturna |
| --- | --- | --- | --- | --- |
| 111 | Fortuna / Fortune | DS | Ascendente + Luna − Sol | Ascendente + Sol − Luna |
| 288 | Espíritu / Spirit | VV | Ascendente + Sol − Luna | Ascendente + Luna − Sol |
| 90 | Eros (hermético) / Eros (Hermetic) | PA | Ascendente + Venus − Espíritu | Ascendente + Espíritu − Venus |
| 206 | Necesidad (hermética) / Necessity (Hermetic) | PA | Ascendente + Fortuna − Mercurio | Ascendente + Mercurio − Fortuna |
| 51 | Coraje / Courage | PA | Ascendente + Fortuna − Marte | Ascendente + Marte − Fortuna |
| 320 | Victoria / Victory | PA | Ascendente + Júpiter − Espíritu | Ascendente + Espíritu − Júpiter |
| 211 | Némesis / Nemesis | PA | Ascendente + Fortuna − Saturno | Ascendente + Saturno − Fortuna |

Las fuentes secundarias completas están en cada registro. Fortuna y Espíritu se identifican como dependencias antes de los otros cinco; no se ejecutó aún ese grafo. En el PDF, Eros (Hermetic) y Necessity (Hermetic) no llevan la categoría Hermetic, aunque sí aparece en su nombre. Se conserva esta diferencia. Victory sí incluye Mundane; esa categoría no se elimina por formar parte de la selección solicitada.

## Operandos y límites actuales

“Disponible” significa que la carta actual aporta la posición o los datos base; **no significa que el nuevo motor ya esté implementado**. Las cúspides y regentes quedan ligados al sistema de casas activo. Se propone regencia por domicilio tradicional, pendiente de revisión para las fórmulas que la requieran. Los nodos usarían la opción medio/verdadero de la carta.

Fortune, Spirit y Eros (Valens) son referencias a registros precisos, no nombres reemplazados arbitrariamente. Sus dependencias figuran por ID. No se devuelve cero ante datos faltantes. Los grados explícitos 0 Gemini, 0 Leo y 0 Virgo se identifican como 60°, 120° y 150°; los grados no nulos quedan pendientes para no confundir grado ordinal y longitud desde cero.

| Operando impreso | Motivo pendiente | Filas |
| --- | --- | --- |
| Ruler Syzygy | Falta resolver la sizigia y confirmar el criterio de regencia de la fuente. | 54, 226 |
| 18 Aries | Convención de grado ordinal frente a longitud desde cero no explicitada en el PDF; no convertir automáticamente. | 95 |
| 2 Taurus | Convención de grado ordinal frente a longitud desde cero no explicitada en el PDF; no convertir automáticamente. | 96 |
| Lord of Hour | El proyecto no dispone todavía de un cálculo validado de horas planetarias. | 132, 225, 267, 312 |
| 15 Cancer | Convención de grado ordinal frente a longitud desde cero no explicitada en el PDF; no convertir automáticamente. | 201, 203 |
| 15 Leo | Convención de grado ordinal frente a longitud desde cero no explicitada en el PDF; no convertir automáticamente. | 202 |
| 29 Cancer | Convención de grado ordinal frente a longitud desde cero no explicitada en el PDF; no convertir automáticamente. | 204 |
| New Moon | Falta determinar el evento de referencia y calcular su longitud. | 248 |
| Syzygy | Falta determinar el evento de referencia y calcular su longitud. | 253 |
| MC of Sun | Operando sin definición operativa en el PDF; requiere revisión. | 264 |
| Cancer | Signo sin grado: no sustituir por 0° ni por su regente. | 302, 304 |
| Leo | Signo sin grado: no sustituir por 0° ni por su regente. | 302, 304 |

Los operandos no resolubles afectan **17 filas**. En `status` aparecen 16 `unsupported_operand` porque la fila 312 también es Dub. y conserva `dubious` como estado principal; sus dos banderas permanecen registradas. Del mismo modo, las 14 marcas Mult. se conservan aunque algunos registros tengan estado principal `conditional`.

## Bibliografía incompleta y notas ausentes

| Código sin definición | Filas |
| --- | --- |
| AO | 187, 188, 191 |
| HT | 59, 136, 168, 194 |
| M | 277 |
| RB | 268 |

No se expandieron **HT, AO, RB o M**. Las menciones Theophilus y Persians dentro de condiciones se mantienen literales, sin asignarles un código por suposición. La fila 82 tiene “MSV GI” sin coma: se separan como dos códigos existentes, preservando la celda original. Spirit repite VV como primaria y secundaria; se conserva tal como aparece.

En **70 filas** aparece ⓘ, pero el PDF no contiene el texto emergente. Sus 364 anotaciones son enlaces y ninguna aporta contenido de nota. No se consultó la web para reconstruirlo. Los nombres alternativos impresos en cursiva sí se extrajeron por separado. Las referencias bibliográficas conservan las grafías del PDF, incluidas posibles erratas.

## Variantes y duplicados

No hay nombres principales exactamente repetidos tras normalizar espacios y mayúsculas. Se identificaron **59 grupos candidatos de variantes**: quitar paréntesis y sufijos de variante sirve para encontrarlos, pero no autoriza a fusionarlos. Hay **48 grupos de operandos idénticos** y **61 grupos de operandos más regla nocturna idénticos**; el segundo conteo puede ser mayor porque una agrupación se divide al distinguir reglas nocturnas.

| Familia candidata | Registros conservados |
| --- | --- |
| activity | 2: Activity (Olympiodorus 1); 3: Activity (Olympiodorus 2); 4: Activity (Rhetorius) |
| adultery | 5: Adultery 1; 6: Adultery 2 |
| air and wind | 8: Air and Wind; 9: Air and Wind (Mercury in Virgo); 10: Air and Wind (Mercury in Gemini) |
| association | 13: Association 1; 14: Association 2; 15: Association 3 |
| authority, aid & conquering | 18: Authority, Aid & Conquering; 19: Authority, Aid & Conquering (Alt) |
| basis | 21: Basis (Firmicus); 22: Basis (Valens); 23: Basis 2 |
| business | 33: Business A; 34: Business B |
| children | 38: Children; 39: Children (Firmicus); 40: Children (Firmicus)(Alt); 41: Children (Sahl/Hermes) |
| contract | 48: Contract 1; 49: Contract 2 |
| death | 59: Death; 60: Death (al-Ṭabarī 1); 61: Death (al-Ṭabarī 2); 62: Death (Laurentianus); 63: Death (Olympiodorus); 64: Death (Persian); 65: Death (Rhetorius) |
| dignity | 74: Dignity; 75: Dignity B |
| dreams | 78: Dreams A; 79: Dreams B |
| enemies | 82: Enemies (Ancients/Olympiodorus A); 83: Enemies (Firmicus); 84: Enemies (Hermes); 85: Enemies (Laurentianus); 86: Enemies (Olympiodorus B); 87: Enemies (Olympiodorus C) |
| eros | 89: Eros (Firmicus); 90: Eros (Hermetic); 91: Eros (Olympiodorus) A; 92: Eros (Olympiodorus) B; 93: Eros (Valens) |
| exaltation | 95: Exaltation (Day); 96: Exaltation (Night) |
| farming | 101: Farming A; 102: Farming B |
| father | 103: Father; 104: Father (Alt 1); 105: Father (Alt 2) |
| female children | 107: Female Children (Dorotheus); 108: Female Children (Valens) |
| friends | 115: Friends; 116: Friends (Firmicus); 117: Friends (Olympiodorus 1) a; 118: Friends (Olympiodorus 1) B; 119: Friends (Olympiodorus 2) |
| grandfathers | 120: Grandfathers; 121: Grandfathers (Alt 1); 122: Grandfathers (Alt 2) |
| grief | 124: Grief 1A; 125: Grief 1B |
| homeland | 127: Homeland A; 128: Homeland B; 129: Homeland C |
| illness | 134: Illness (Ancients); 135: Illness (Dorotheus - Chinese); 136: Illness (Dorotheus); 137: Illness (Laurentianus) |
| imprisonment | 138: Imprisonment A; 139: Imprisonment B |
| inheritance | 142: Inheritance 1; 143: Inheritance 2 |
| injury | 144: Injury 1; 145: Injury 2; 146: Injury 3 |
| judgment | 150: Judgment 1A; 151: Judgment 1B; 152: Judgment 1C; 153: Judgment 2 |
| knowledge & meditation | 157: Knowledge & Meditation; 158: Knowledge & Meditation (al-Qabīṣī) |
| life | 161: Life 1; 162: Life 2a; 163: Life 2b; 164: Life 2c; 165: Life 2d |
| livelihood | 168: Livelihood (Dorotheus); 169: Livelihood 2; 170: Livelihood 3; 171: Livelihood 4 |
| male children | 179: Male Children (Dorotheus - Chinese); 180: Male Children (Dorotheus); 181: Male Children (Hermes); 182: Male Children (Persian/Theophilus); 183: Male Children (Valens) |
| marriage | 185: Marriage (Firmicus); 186: Marriage (Horary); 187: Marriage (Men, a/t Dorotheus); 188: Marriage (Men, a/t Valens); 189: Marriage (Valens); 190: Marriage (Women, a/t Dorotheus); 191: Marriage (Women, a/t Valens) |
| military service | 195: Military Service (Firmicus); 196: Military Service (Laurentianus); 197: Military Service (Olympiodorus 1) |
| nature of the planets | 201: Nature of the Planets (Moon); 202: Nature of the Planets (Sun) |
| navigation | 203: Navigation (Hellenistic); 204: Navigation (Medieval) |
| necessity | 205: Necessity (Firmicus); 206: Necessity (Hermetic); 207: Necessity (Persian); 208: Necessity (Valens) |
| nemesis | 211: Nemesis; 212: Nemesis (Firmicus) |
| noxious place | 213: Noxious Place; 214: Noxious Place (alternative) |
| nuts | 216: Nuts (al-Bīrūnī); 217: Nuts (al-Qabīṣī Latin) |
| prisoners | 232: Prisoners (Day); 233: Prisoners (Night) |
| punishment | 237: Punishment (Hellenistic); 238: Punishment (Medieval) |
| purchase | 239: Purchase 1A; 240: Purchase 1B; 241: Purchase 2A; 242: Purchase 2B |
| rain | 247: Rain (Annual); 248: Rain (Ibn Ezra) |
| real estate | 249: Real Estate (al-Ṭabarī); 250: Real Estate (Hermes); 251: Real Estate (Persian) |
| reward | 255: Reward 1; 256: Reward 2A; 257: Reward 2B; 258: Reward 3 |
| royal lot | 261: Royal Lot (al-Ṭabarī); 262: Royal Lot (Theophilus) |
| rulership & authority | 263: Rulership & Authority 1; 264: Rulership & Authority 2 |
| rulership | 265: Rulership 1; 266: Rulership 2 |
| sale | 269: Sale 1; 270: Sale 2 |
| sesame | 274: Sesame 1; 275: Sesame 2 |
| siblings | 277: Siblings; 278: Siblings (Firmicus); 279: Siblings (Persian) |
| sugar | 295: Sugar (al-Bīrūnī); 296: Sugar (al-Qabīṣī Latin) |
| theft | 306: Theft (Olympiodorus); 307: Theft (Valens) |
| travel | 315: Travel; 316: Travel (Firmicus) |
| underground things | 317: Underground Things A; 318: Underground Things B; 319: Underground Things C |
| victory | 320: Victory; 321: Victory (Olympiodorus) |
| water | 323: Water (Commodity); 324: Water (Element) |
| wealth | 327: Wealth A; 328: Wealth B |
| wheat | 330: Wheat; 331: Wheat (al-Bīrūnī) |

También se conservan las coincidencias de nombres alternativos en `duplicados-y-variantes.json`. No se declaró que dos materias con igual fórmula sean el mismo lote.

## Reglas especiales conservadas

| Fila | Nombre original | Regla nocturna literal / indicación del nombre |
| --- | --- | --- |
| 9 | Air and Wind (Mercury in Virgo) | Solo en nombre: Air and Wind (Mercury in Virgo) |
| 10 | Air and Wind (Mercury in Gemini) | Solo en nombre: Air and Wind (Mercury in Gemini) |
| 20 | Barley | reverse (B) |
| 22 | Basis (Valens) | reverse (MSL, MSP, MSV, GI, Q, R), always below horizon (VV) |
| 25 | Beans | reverse (B) |
| 29 | Bitter Foods | reverse (B) |
| 37 | Chick-peas | reverse (B) |
| 38 | Children | reverse (GI, Q, R) |
| 39 | Children (Firmicus) | always below horizon |
| 50 | Cotton | reverse (B) |
| 63 | Death (Olympiodorus) | reverse (O1, MSP, MSV) |
| 82 | Enemies (Ancients/Olympiodorus A) | reverse (O1, O2, MSL, MSP, MSV, R) |
| 104 | Father (Alt 1) | reverse (GI) |
| 107 | Female Children (Dorotheus) | reverse (MSL, Theophilus) |
| 115 | Friends | reverse (O1, MSL, BA, SB) |
| 123 | Grapes | reverse (B) |
| 129 | Homeland C | reverse (O1) |
| 130 | Honey | reverse (B) |
| 140 | Indecency and Lust | use both |
| 160 | Lentils | reverse (B) |
| 181 | Male Children (Hermes) | reverse (MSL) |
| 182 | Male Children (Persian/Theophilus) | reverse (Persians) |
| 187 | Marriage (Men, a/t Dorotheus) | reverse (FM, MSL, AO) |
| 188 | Marriage (Men, a/t Valens) | day (AO) |
| 190 | Marriage (Women, a/t Dorotheus) | reverse (MSL) |
| 191 | Marriage (Women, a/t Valens) | night (AO) |
| 194 | Military Expedition | reverse (MSL) |
| 195 | Military Service (Firmicus) | reverse (MSP, MSV) |
| 207 | Necessity (Persian) | reverse (LJ) |
| 222 | Olives | reverse (B) |
| 223 | Onions | reverse (B) |
| 232 | Prisoners (Day) | Solo en nombre: Prisoners (Day) |
| 233 | Prisoners (Night) | Solo en nombre: Prisoners (Night) |
| 236 | Pungent/Spicy Foods | reverse (B) |
| 244 | Purgative & Sour Medicines | reverse (B) |
| 259 | Rice | reverse (B) |
| 261 | Royal Lot (al-Ṭabarī) | reverse (if Jupiter is stronger) |
| 268 | Rumors, True or False | reverse (GI, RB) |
| 277 | Siblings | reverse (VV, FM, M) |
| 280 | Silk | reverse (B) |
| 297 | Sweet Foods | reverse (B) |
| 303 | The Master | reverse (MSP, MSV) |
| 316 | Travel (Firmicus) | reverse (O1, MSL, MSP, MSV) |
| 317 | Underground Things A | reverse (MSP, MSV) |
| 323 | Water (Commodity) | reverse (B) |

`reverseAtNight: null` expresa una regla que no puede reducirse a sí/no. `dayFormula` y `nightFormula` son propuestas simbólicas; una fórmula null queda sin resolver o no aplica a esa secta, según las condiciones del registro. `baseFormulaAsPrinted` preserva los tres operandos aun cuando la fórmula no pueda habilitarse. Ninguna es ejecutada por este paquete.

## Criterios de revisión

Todos los registros tienen `extractionReview: pending_user_review`; ninguno se declaró `verified`. Los 31 Dub. quedan desactivados por defecto y requieren una futura activación explícita. Todo el catálogo permanece sin activar hasta aprobar esta etapa.

Las traducciones al español son editoriales, conservan el inglés y los nombres propios de las autoridades, y quedan abiertas a corrección. Los contextos se toman solo de categorías explícitas: no se convierte Hellenistic o Medieval automáticamente en Natal. La selección natal futura deberá respetar las exclusiones y la excepción solicitada para los siete lotes iniciales.

## Validación y reproducción

Se cotejaron visualmente las columnas y las filas de los siete lotes iniciales, así como muestras de variantes, reglas especiales, primeras y últimas filas y bibliografía. Los controles automatizados y su salida se encuentran en `resultado-pruebas.txt`. Son pruebas del catálogo y su transcripción, **no pruebas de un motor que todavía no existe**.

Para repetir los controles: `python validar_catalogo.py`.
Para reconstruir desde el PDF original, con pdfplumber instalado: `python extraer_pdf.py --pdf "ruta/al/documento.pdf"`; luego `python build_catalog.py --pdf "ruta/al/documento.pdf"` y `python make_review.py`.

Fuente: `Arabic Lots, List of Astrology Arabic Parts Formulas.pdf`. SHA-256: `85d024f3ace148f9d4ebaed8b657e4307c925129136cab375d107a4926390f18`. Las filas llevan página, ordinal y rectángulo en puntos PDF; el origen del rectángulo es superior izquierdo.

**Esta entrega se detiene antes del motor de cálculo, como solicitaste. La próxima etapa requiere tu revisión del catálogo y de los casos pendientes.**
