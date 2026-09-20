# Validación: rueda y cuatro sistemas de casas

Comprobación del 19/9/2026. Mismo proyecto local: Python 3.11, pyswisseph 2.10.3.2 (motor Swiss Ephemeris 2.10.03), tzdata 2026.2, TypeScript 5.9.3 y Node 24.

## Resultado

**73 pruebas aprobadas, sin fallos.**

| Grupo | Pruebas | Resultado |
|---|---:|---|
| Python: cálculo, horarios, casas y HTTP | 43 | Aprobadas; incluyen las 31 pruebas anteriores |
| Geometría SVG, colisiones y aspectos, semisumas | 51 | Aprobadas |
| Navegador real: integración, dimensiones y exportación | 12 | Aprobadas |

Compilación y comprobación de tipos completadas. Se conservan las referencias originales y se añaden tres cartas por cuatro sistemas.

## Casas y referencias

`tests/houses-reference.json` contiene la salida congelada de swetest64.exe oficial para Greenwich (1/1/2000, 12 UTC), Buenos Aires (15/6/1987, 15:30 UTC) y Reikiavik (21/6/2024, 00 UTC). Incluye comandos, salida original y huella del ejecutable.

Se comparan **144 cúspides**, ASC y MC en B/R/P/W, con tolerancia de 0,000001°. Las coordenadas, grados y minutos y las casas ocupadas por planetas están en `COMPARACION-CASAS.md`. La hora elegida para Reikiavik genera casas especialmente desiguales.

Las pruebas hacen fallar `swe.calc` si se llama al cambiar de casas: los cambios pasan sin recalcular planetas. Se comprueban conservación exacta de longitudes y ángulos, actualización de ocupación y sistema identificado en cada fila. En signos enteros se verifican cúspides a 0° de signo y ASC/MC separados de I/X.

En Tromsø (69.6492 N, 18.9553 E, 21/6/2024 a las 12 UTC), Placidus produce el error esperado: HTTP 422, diagnóstico técnico sin datos personales, ningún resultado parcial y recuperación al elegir signos enteros. Se prueban también cúspides corruptas, coordenadas alteradas y sistemas desconocidos.

El contraste con swetest verifica la integración con una herramienta oficial separada del código de la aplicación. No es una comparación con otro modelo astronómico. Queda pendiente tu validación en el programa que usás.

## Rueda

Se prueban puntos cardinales, transformación e inversa, sentido antihorario, 360 marcas, doce sectores de 30°, cúspides reales y casas desiguales. Se comprueban conjuntos de nueve cuerpos, 200 distribuciones sintéticas y el cruce Piscis/Aries.

La revisión visual de imágenes rasterizadas detectó superposiciones externas en una carta sintética extrema. Se corrigieron usando las cajas rotadas de las etiquetas; sus pruebas quedaron incluidas. Solo se desplazan etiquetas, nunca posiciones o cúspides reales.

Los SVG llevan glifos como trazados y los avisos OFL completos. No requieren fuentes, imágenes ni estilos externos. El sistema activo figura en la cabecera visible, título, descripción y atributo del SVG.

## Navegador

`tests/browser.html`, disponible solo con `--test-ui`, prueba la aplicación real en un iframe:

- SVG XML válido, descripción accesible, 360 marcas y nueve cuerpos.
- Coherencia del selector, tabla, rueda y SVG en los cuatro sistemas (cuatro pruebas).
- Semisumas precargadas, personalización, restablecimiento y coincidencia tabla/rueda.
- Orbe inválido: bloqueo de exportación obsoleta y recuperación al corregirlo.
- Ocultar grados/cúspides sin perder ángulos.
- Escritorio de 1366 px: rueda cuadrada, sin desbordamiento y contornos dentro del SVG.
- Móvil de 390 px: las mismas comprobaciones y zoom al 300 % sin desbordar la página.
- PNG decodificable de 3300 × 3300 y modo impresión sin fuentes externas.
- Error polar de Placidus y recuperación con signos enteros.

Resultado final: **12 pruebas aprobadas; 0 fallidas**. No se probó en un teléfono físico ni en todos los navegadores.

## Pruebas no aplicables

No existe un módulo de partes tradicionales en el proyecto recibido. No se puede comprobar todavía la actualización de partes dependientes de cúspides ni la invariancia de Fortuna/Espíritu. No se añadieron fórmulas, pruebas ficticias ni resultados inventados; no están incluidas en el total aprobado.

## Repetir

```text
.venv\Scripts\python.exe -m unittest discover -s tests -v
npm run build
npm run check
npm run test:wheel
.venv\Scripts\python.exe server.py --port 8766 --test-ui
```

Con el último comando activo, abrir `http://127.0.0.1:8766/tests/browser.html`. El arranque habitual sigue siendo INICIAR.cmd, sin rutas de pruebas.

## Actualización de orbes por semisuma

43 pruebas Python, 51 pruebas Node y 12 pruebas reales de navegador aprobadas (106 en total). Incluye 21 semisumas, cinco aspectos exactos y sus límites, un segundo de arco fuera, cuatro controles Marte–Júpiter, exclusión de puntos, personalización y restablecimiento. Verificación visual de la rueda de Greenwich con ocho aspectos activos. Aplicación/separación no está implementada.

## Estado actual: dignidades esenciales y anillo de términos

**164 pruebas aprobadas**: 48 Python, 102 Node (incluidas 51 de dignidades), 14 de navegador real. TypeScript compila sin errores. Se comprobaron los 60 intervalos, 36 faces, secta solar, testimonios simultáneos, tabla de referencia sin carta, concordancia tabla/cálculo/anillo, ocultación, interacción, puntuación opcional y exportaciones. Se corrigió el contenedor de desplazamiento horizontal de tablas. La rueda exportada se inspeccionó visualmente. Ver `DIGNIDADES.md`. Los recuentos de apartados anteriores son históricos.

## Presentación sexagesimal y movimiento instantáneo

200 pruebas: 48 Python, 137 Node y 15 de navegador. Los formateadores conservan los datos, redondean solo el texto, resuelven acarreos y compensan errores binarios en empates. Se comprueba el límite de orbe con un segundo de arco fuera aunque su texto coincida con el límite, velocidades firmadas, retrogradación, cruce de Aries, oposición, igualdad y ausencia de velocidades. Comparación de la clasificación con diferencias finitas independientes. SVG usa formato sexagesimal en títulos y descripción; exportación PNG validada.

## Tabla compacta de aspectos

204 pruebas: 48 Python, 141 Node, 15 navegador. Presentación de cinco columnas, solo aspectos activos, desviación en D°MM′SS″, alias visual Aplicativo, orden por planeta/orbe, CSV UTF-8 con BOM y correspondencia exacta por pareja/aspecto con la rueda. Se reemplazaron las expectativas de interfaz de ocho columnas y detalle técnico por las nuevas; las pruebas de cálculo y movimiento se conservan.
