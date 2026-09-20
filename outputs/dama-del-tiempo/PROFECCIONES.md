# Profecciones anuales por signos enteros

Método: edad cumplida módulo 12; casa activada = resto + 1; signo activado = signo del Ascendente + resto. Se reutilizan las regencias tradicionales de `src/data/rulerships.json`. La regla procede de la especificación del usuario; no se atribuye este método a la tabla de dignidades de Lilly.

## Uso
Calculá una carta y abrí Profecciones anuales. Elegí Edad o Fecha objetivo. La edad ingresada manda en el primer modo. Las fechas usan calendario gregoriano y aniversarios civiles, con comienzo inclusivo y final exclusivo, sin revolución solar. El 29 de febrero usa el 28 de febrero en años comunes; el selector permite corregirlo al 1 de marzo. El día natal conserva edad cero. Fechas anteriores al nacimiento y edades negativas o fraccionarias producen un mensaje, nunca un resultado parcial. Ir al año actual usa la fecha civil del equipo.

La ficha conserva los datos natales del señor del año. Distingue casas regidas por signos enteros de casas por regencia de las cúspides del sistema visible. Las dignidades se consultan en el motor actual, sin nuevas tablas ni cambios. Los aspectos usan el conjunto natal válido y los orbes vigentes.

Los puntos avanzados incluyen siete planetas, Medio Cielo y lotes que ya estén calculados. Fortuna y Espíritu aparecen al calcular los lotes predeterminados. Ascendente siempre determina al señor del año. Las posiciones simbólicas conservan el grado natal sin redondeo interno; solo se formatea su texto.

Mostrar profección añade una banda al signo activado, identifica casa y señor del año, y dibuja rombos y marcas P1, P2… correspondientes a la tabla. Los planetas y cúspides natales no se mueven. SVG/PNG siguen el estado del selector. JSON conserva resultado, consulta, período, datos natales y puntos simbólicos separados.

## Casos de control: Ascendente en Tauro
| Edad | Casa | Signo | Señor del año |
|---|---|---|---|
| 0 | I | Tauro | Venus |
| 1 | II | Géminis | Mercurio |
| 11 | XII | Aries | Marte |
| 12 | I | Tauro | Venus |
| 40 | V | Virgo | Mercurio |

## Validación
259 pruebas aprobadas: 189 JavaScript (25 nuevas), 48 Python y 22 de navegador (2 nuevas). Incluyen los cinco controles, doce ascendentes, regencias tradicionales, aniversarios, años seculares, dos políticas bisiestas, conservación del grado, independencia de casas, integración de lotes, tabla/rueda, exportación y regresiones anteriores.

## Archivos
Nuevos: `src/profections.ts`, `src/profections-ui.ts`, `src/profections-wheel.ts`, `tests/profections.test.mjs`, este documento.
Modificados: `src/app.ts`, `src/lots-ui.ts` (acceso de solo lectura a resultados existentes), `web/index.html`, `web/style.css`, `server.py` (rutas estáticas), `tests/browser.js`, `package.json`, `PROBAR.cmd`, `README.md`.
Compilados: `web/app.js`, `web/lots-ui.js`, `web/profections.js`, `web/profections-ui.js`, `web/profections-wheel.js`.

No se agregaron otras técnicas predictivas ni interpretación automática.
