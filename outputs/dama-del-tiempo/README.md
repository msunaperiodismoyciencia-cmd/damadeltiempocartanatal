# Dama del Tiempo — rueda y cuatro sistemas de casas

Prototipo local, gratuito y de código abierto para calcular posiciones de astrología tradicional. Licencia del proyecto: **AGPL-3.0-only**. No está publicado ni desplegado. Continúa la arquitectura original Python + TypeScript.

**Actualización:** rueda exportable SVG/PNG, orbes planetarios medievales por semisuma y selector de Alcabitius, Regiomontanus, Placidus y signos enteros. Leé `RUEDA-Y-CASAS.md` y las tablas de `COMPARACION-CASAS.md`.

## Abrir la aplicación

En esta computadora ya está instalada: abrí **INICIAR.cmd** y conservá abierta la ventana del servidor mientras trabajás. El navegador abre `http://127.0.0.1:8765`. Para cerrar el motor, cerrá esa ventana. Si ya hay una instancia abierta, usá su página en lugar de iniciar otra.

En otra computadora Windows: instalá Python 3.11 desde python.org, descomprimí el proyecto, ejecutá **INSTALAR.cmd** una vez con Internet y luego **INICIAR.cmd**. El JavaScript compilado ya está incluido: no hace falta instalar Node para usarlo. La instalación no agrega cuentas ni servicios de pago.

En macOS o Linux con Python 3.11:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python server.py --open
```

## Qué funciona

- Fecha, hora con segundos, nombre opcional, búsqueda de localidades e ingreso manual.
- Búsqueda explícita mediante Open-Meteo/GeoNames: devuelve coordenadas y zona IANA. Se elige una coincidencia, nunca se acepta silenciosamente la primera.
- Reglas horarias de `tzdata 2026.2`, incluidos cambios históricos y horario de verano. Las horas inexistentes se rechazan; las repetidas requieren elegir una ocurrencia.
- Siete planetas tradicionales, Ascendente, Medio Cielo y doce cúspides del sistema seleccionado, calculados con Swiss Ephemeris. Alcabitius sigue siendo predeterminado.
- Nodo medio o verdadero y Nodo Sur opuesto al Norte.
- Tabla con signo, grado, minuto, casa activa, comparación por signos enteros, velocidad en grados/día y movimiento. Cúspides con longitud absoluta y sistema identificado.
- Interfaz adaptable, controles con etiquetas y mensajes en español.
- Código fuente descargable desde la propia interfaz; avisos y licencias incluidos.

La rueda SVG incluye los aspectos tradicionales según los orbes elegidos por el usuario y permite descargar SVG o PNG de 3300 × 3300. Queda pendiente la descarga CSV de tablas. Incluye dignidades esenciales y anillo de términos egipcios; leé `DIGNIDADES.md`. No hay partes tradicionales, interpretaciones ni técnicas predictivas.

## Cómo usarla y verificarla con tu programa

1. Ingresá fecha y hora **locales**, con segundos si los conocés.
2. Buscá el lugar y seleccioná la ciudad y región correctas. La posición corresponde al centro urbano; ajustá coordenadas si tu programa usa otro punto.
3. Revisá la zona IANA. No se usa un desplazamiento UTC actual para fechas históricas: se consulta la regla de la fecha.
4. Seleccioná el mismo tipo de nodo que en tu programa. Usá zodíaco tropical, cálculo geocéntrico y casas Alcabitius. No actives posiciones topocéntricas, sidéreas o heliocéntricas.
5. Compará primero la **hora UTC**, luego Sol, Luna, Ascendente, MC y las doce cúspides. Diferencias en UTC suelen explicar diferencias mayores en casas.
6. Si difiere un minuto, compará más decimales: esta interfaz redondea al minuto más cercano. En los datos del motor se conservan decimales.
7. Si una casa difiere cerca de una cúspide, revisá la regla de pertenencia: aquí se usa la longitud eclíptica, sin regla de los 5° y sin latitud planetaria para la asignación.

Usá el botón **Cargar ejemplo de comprobación** y luego **Calcular carta**. Referencia: 1/1/2000, 12:00:00 UTC, latitud 51.4779 N, longitud 0, nodo medio:

| Punto | Resultado redondeado |
|---|---|
| Sol | Capricornio 10° 22′ |
| Luna | Escorpio 13° 19′ |
| Ascendente | Aries 24° 16′ |
| Medio Cielo | Capricornio 09° 37′ |

Segundo caso: Buenos Aires, 15/6/1987 a las 12:30 locales, zona `America/Argentina/Buenos_Aires`, latitud −34.6037, longitud −58.3816; equivale a 15:30 UTC. Ascendente Virgo 10° 47′; MC Géminis 18° 30′. Los valores completos y las instrucciones de swetest están en `tests/swetest-reference.json`.

## Límites honestos

- Fechas UTC entre **1800 y 2399**, calendario gregoriano. Los archivos incorporados cubren ese intervalo. No hay soporte de calendario juliano en esta etapa.
- Latitudes estrictamente entre **−90° y +90°**, sin los polos exactos. Cada sistema se valida individualmente: por ejemplo, Placidus falla en regiones polares. Un error no se sustituye por otro sistema ni se presenta como carta válida.
- IANA no garantiza la historia civil exacta de todos los lugares antes de 1970. Una zona asociada actualmente a una localidad tampoco prueba todas sus fronteras administrativas históricas. Aparece una advertencia para fechas anteriores a 1970; la elección es revisable manualmente. Las reglas futuras pueden cambiar por ley.
- La precisión de la conversión está limitada por los datos históricos disponibles. Usar Swiss Ephemeris no resuelve una hora de nacimiento o zona histórica desconocida.
- El umbral estacionario predeterminado es **0,001°/día**, provisional y editable. No se presenta como una regla tradicional universal.
- El servidor escucha solamente en esta computadora. El diseño móvil se prueba en un navegador estrecho; abrirlo desde otro teléfono requeriría configurar una conexión local o un alojamiento, fuera de esta etapa.
- HTTPServer es adecuado para este prototipo local; no es una configuración de producción pública.

## Privacidad y costos

Los cálculos se realizan en Python, en tu computadora. La fecha, hora y coordenadas viajan solo al proceso local y se descartan tras responder. El nombre no se envía al motor. No hay base de datos, archivos de cartas, registros de solicitudes, publicidad, analítica, cookies ni cuentas.

La aplicación no integra OpenAI, no consume tokens y no llama a modelos de lenguaje. No usa servicios astrológicos externos. Tampoco carga fuentes o bibliotecas desde un CDN.

Al pulsar Buscar se consulta Open-Meteo con el texto del lugar. Ese proveedor recibe también la IP como parte de la conexión. Su API gratuita está limitada a uso no comercial y tiene límites de consultas; no debe confundirse «gratuito para usuarios» con «no comercial». Para un uso profesional/comercial, omití la búsqueda y cargá coordenadas/zona manualmente hasta incorporar un catálogo local de GeoNames u otro proveedor compatible. El motor sigue funcionando gratis y sin conexión.

No se contrataron planes ni se configuró facturación. Usar el equipo propio no requiere alojamiento. Publicar en el futuro puede implicar costos de servidor, dominio y mantenimiento; ningún servicio gratuito garantiza disponibilidad perpetua. El proveedor de localidades está aislado en `/api/places` y puede sustituirse.

## Arquitectura y mantenimiento

| Parte | Archivo | Responsabilidad |
|---|---|---|
| Tiempo civil | `time_conversion.py` | Zona IANA → UTC, horas repetidas/inexistentes |
| Astronomía | `astronomy.py` | Swiss Ephemeris, UTC → TT/UT1, posiciones |
| Sistemas de casas | `houses.py` | Registro único B/R/P/W y cálculo Swiss de cúspides |
| Reglas | `rules.py` | Signos, formato, movimiento, pertenencia a casas, Nodo Sur |
| Servicio local | `server.py` | Comunicación local y búsqueda sustituible |
| Presentación | `src/app.ts`, `src/wheel.ts`, `web/` | Formulario, mensajes, tablas y rueda |
| Aspectos | `src/aspects.ts` | Reglas angulares y semisumas de orbes planetarios, sin recalcular astronomía |
| Validación | `tests/` | Referencias oficiales y casos temporales |

Se eligió Python desde esta etapa para aprovechar la integración nativa disponible y comprobable. Swiss Ephemeris puede compilarse a WebAssembly; no se afirma que sea imposible ejecutarlo en navegador. Evaluar un paquete WASM, sus archivos de efemérides y equivalencia queda para otra etapa si conviene eliminar la instalación de Python. La separación actual permite cambiar el transporte sin mezclar reglas ni presentación.

Para editar la interfaz se usa TypeScript 5.9.3. Con Node/npm instalados: `npm ci` y `npm run build`. `web/app.js` es el resultado compilado y debe entregarse actualizado con `src/app.ts`. Para revisar tipos: `npm run check`.

Para ejecutar las pruebas: **PROBAR.cmd**, o `.venv/Scripts/python.exe -m unittest discover -s tests -v` en Windows. Consultá `VALIDACION.md` para el alcance de la comprobación realizada.

## Lotes tradicionales

Tras la revisión del catálogo y la indicación de continuar, se incorporó el motor independiente descrito en `LOTES.md`. Incluye 335 registros locales de la compilación de Eric Lusby, sus fuentes y advertencias. Se calculan inicialmente Fortuna, Espíritu, Eros hermético, Necesidad hermética, Coraje, Victoria y Némesis. Los casos no resueltos permanecen bloqueados.

La sección permite buscar, filtrar, elegir favoritos, calcular una selección o todos los compatibles con el contexto y exportar resultados. Solo los lotes calculados y elegidos se dibujan en la rueda. Las casas comparadas reutilizan los cuatro sistemas existentes; no se recalculan los planetas. No se publicará automáticamente.

## Licencias y fuentes

Leé `LICENCIAS.md`, `NOTICE.md` y `LICENSE`. Se verificaron las fuentes oficiales el 19/9/2026:

- [Swiss Ephemeris: licencia oficial](https://github.com/aloistr/swisseph/blob/master/LICENSE).
- [pyswisseph 2.10.3.2](https://pypi.org/project/pyswisseph/2.10.3.2/).
- [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html).
- [IANA: alcance y límites históricos](https://data.iana.org/time-zones/theory.html).
- [Open-Meteo: búsqueda de lugares](https://open-meteo.com/en/docs/geocoding-api) y [condiciones](https://open-meteo.com/en/terms).

Dignidades esenciales: fuentes estructuradas en `src/data/`, triplicidades de Doroteo, términos egipcios, faces caldeas y puntuación opcional. Tabla completa disponible sin carta.

## Profecciones anuales

Módulo por signos enteros, consulta por edad o fecha, ficha natal del señor del año y capa SVG/PNG opcional. Ver [PROFECCIONES.md](PROFECCIONES.md) para convenciones, casos de control y pruebas.
