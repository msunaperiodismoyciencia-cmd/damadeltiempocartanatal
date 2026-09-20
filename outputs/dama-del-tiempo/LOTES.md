# Lotes tradicionales — integración local

Implementación autorizada al solicitar continuar después de la entrega del catálogo extraído. La aprobación de esta etapa no resuelve las ambigüedades señaladas en el informe.

## Datos y atribución

`src/data/lots-catalog.json` reproduce los 335 registros revisados del PDF de la compilación de Eric Lusby publicada por Astro-Seek. `src/data/lots-sources.json` conserva la bibliografía. Se mantienen versión `0.1.0-review.1`, huella SHA-256 del PDF, fuentes, reglas nocturnas, categorías y referencias de fila. El estado histórico del registro no cambia a “verified” por haberlo integrado en código.

No se consulta Astro-Seek al cargar ni calcular una carta. El catálogo y las fuentes se sirven desde los archivos locales. El texto emergente ausente del PDF no se reconstruyó. Las grafías de las fuentes originales se conservan.

## Cálculo

`src/lots.ts`: normalización a [0°, 360°), operandos tipados, inversión únicamente cuando la fila imprime reverse sin condiciones, restricciones diurnas/nocturnas, dependencias por ID, detección de ciclos y errores explícitos. Celdas ausentes, datos no finitos y dependencias fallidas nunca devuelven 0° Aries.

La secta proviene del módulo solar existente. Regencia: domicilio tradicional. Cúspides y regentes de casas: sistema activo. Cada longitud resultante se sitúa también en Alcabitius, Regiomontanus, Placidus y signos enteros, sin regla de los 5°. Si una comparación no está disponible, se conserva el error del sistema; no se sustituye por otro.

Los grados fijos explícitos de cero se admiten. Los grados no nulos cuya convención no pudo establecerse, la sizigia, su regente, la Luna nueva de referencia, el señor de la hora, MC of Sun y signos sin grado permanecen pendientes. Las condiciones especiales y los códigos bibliográficos sin identificación también bloquean el cálculo.

La inspección de disponibilidad recorre operandos y dependencias sin producir longitudes. Solo se calculan los siete iniciales, una selección explícita o todos los compatibles cuando se pulsa su botón. Los Dub. se ocultan y bloquean por defecto; activarlos no levanta otros bloqueos de operandos o fuentes.

## Interfaz y rueda

`src/lots-ui.ts`: filtros de nombres/alternativos/categorías/fuentes, estado calculable, Dub./Mult., favoritos, selección, cálculo individual/colectivo, explicación y CSV UTF-8. Los favoritos persisten solo como IDs en localStorage; no se guardan nombres de personas ni datos de cartas.

Los resultados muestran posición zodiacal y longitud absoluta al minuto; la precisión interna permanece intacta. Incluyen cuatro casas, regente, fórmula aplicada, operandos de la fuente, secta, fuentes, categorías, estado y advertencias. En carta nocturna, la fórmula aplicada muestra el intercambio correspondiente; los nombres de los tres operandos de la fuente siguen documentando su definición original.

`src/lots-wheel.ts` agrega una capa a la rueda base. Conserva longitudes y marcas de planetas, aspectos, casas y términos. Los lotes llevan identificadores L1, L2… con leyenda de nombres y posiciones. Las etiquetas pueden separarse mediante conectores; sus anclas no se desplazan. La exportación SVG/PNG conserva esa capa con glifos vectoriales.

La tabla puede contener más resultados que la rueda si se pidió calcular todos. Su columna Rueda indica cuáles están dibujados; esos IDs y longitudes coinciden exactamente con la capa gráfica. Las dependencias internas no se dibujan automáticamente.

## Validación

232 pruebas aprobadas: 164 JavaScript (23 nuevas de lotes), 48 Python y 20 de navegador (5 nuevas de integración). Se conservaron las pruebas anteriores de posiciones, cuatro sistemas de casas, aspectos, semisuma, dignidades, precisión y exportación.

Las nuevas pruebas cubren normalización, ambas sectas, inversión/no inversión, grados fijos, cúspides/regentes, dependencias y ciclos, operandos incompatibles, variantes, Dub., filtros, CSV, invariancia de entradas, precisión, posiciones tabla/rueda y controles de selección. El banco de navegador se ejecuta con `server.py --test-ui` y `/tests/browser.html`.

No se implementaron profecciones, revoluciones solares, recepciones, dignidades accidentales ni interpretación automática. No se publicó la aplicación.
