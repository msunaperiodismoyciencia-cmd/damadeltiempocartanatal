# Rueda y sistemas de casas

Esta actualización continúa el proyecto existente y conserva Alcabitius, signos enteros, el motor, el formulario y las tablas.

## Uso

1. Abrí INICIAR.cmd y calculá una carta. Alcabitius es el sistema inicial.
2. Usá **Sistema de casas** para elegir Alcabitius, Regiomontanus, Placidus o signos enteros. El cambio solicita solo nuevas cúspides, no vuelve a calcular planetas, no cambia la hora y no recarga la página.
3. La etiqueta **Sistema activo** identifica la rueda y las tablas. La columna comparativa de signos enteros es secundaria y no cambia el sistema principal.
4. Los aspectos aparecen automáticamente con los orbes planetarios medievales: Sol 15°, Luna 12°, Saturno y Júpiter 9°, Marte 8°, Venus y Mercurio 7°. En **Personalizar orbes planetarios** se modifica cada planeta; **Restablecer valores medievales** recupera los siete valores. Nodos y otros puntos no participan.
5. Se evalúan los cinco ángulos: 0°, 60°, 90°, 120° y 180°. Desviación = |separación angular mínima − ángulo exacto|. El límite es (orbe A + orbe B) / 2, inclusivo con tolerancia numérica 10⁻¹⁰ grados. La tabla muestra dentro y fuera de orbe; la rueda solo los activos. Con orbes personalizados amplios pueden cumplir varios aspectos y se conservan todos. El movimiento se evalúa por las velocidades longitudinales firmadas, sin reglas por signo.
6. Los controles permiten ocultar aspectos, grados planetarios o cúspides, y elegir color o impresión en blanco y negro. Los cuatro ángulos reales permanecen visibles.
7. En celular, elegí **Ampliación → 300 %** para leer grados y minutos y desplazá el recuadro. La vista encajada permite reconocer la rueda completa. Las tablas y la lista de aspectos son equivalentes accesibles.
8. **Descargar SVG** conserva vectores editables y trazados de los glifos. **Descargar PNG** genera 3300 × 3300 píxeles. La cabecera y la descripción exportadas identifican el sistema vigente al pulsar descargar. La ampliación de pantalla no recorta la descarga.

Los orbes y controles se mantienen solo en memoria mientras la página está abierta. No se guardan cartas ni se envían datos a un servicio externo para dibujar o exportar.

## Orientación y colisiones

Se usa una sola transformación de longitud a coordenadas: `θ = 180° − (λ − ASC)`, `x = 550 + r cos θ`, `y = 550 + r sin θ`. La orientación sigue el sistema de coordenadas SVG, donde Y crece hacia abajo. El Ascendente queda a la izquierda y los grados zodiacales crecen en sentido antihorario.

El MC se sitúa con su longitud astronómica; DSC e IC son los opuestos de ASC y MC. Las casas se dibujan con sus cúspides reales y sus números se colocan en el punto medio circular de cada espacio. **En signos enteros, la casa I comienza a 0° del signo ascendente y no en el grado del Ascendente.** Sus cuatro ángulos tienen marcas y etiquetas separadas cuando no coinciden con una cúspide.

Los planetas tienen una marca exacta en el borde interior del anillo zodiacal. Si los glifos se superponen, sus etiquetas se escalonan radialmente y, si es necesario, alrededor del anillo; las líneas finas conservan la conexión con las longitudes originales. El grado escrito nunca cambia por esta distribución. Los aspectos también apuntan a las longitudes originales y no a la posición desplazada de los glifos.

## Fuente única de datos y errores

`houses.py` es el único registro de nombres/códigos B/R/P/W. La interfaz carga ese registro. La respuesta vigente `currentResult.results.house_system` identifica el sistema de todos los resultados mostrados. El selector solicita un cambio y la interfaz sustituye la respuesta completa solo cuando ese cambio es válido; las respuestas anteriores de solicitudes que terminaron tarde se descartan.

`POST /api/houses` recibe la carta ya calculada y llama únicamente al cálculo Swiss de casas. Reutiliza los planetas y conserva ASC/MC. Las reglas asignan casas a partir de los nuevos intervalos eclípticos y registran el sistema en cada fila; no hay fórmulas manuales de cúspides.

Si Swiss Ephemeris informa un error, entrega valores no finitos o cúspides no consecutivas, la operación falla con HTTP 422 y código `HOUSE_CALCULATION_FAILED`. No se acepta la sustitución por Porfirio que la biblioteca C podría intentar cuando Placidus no es calculable; pyswisseph expone esa situación como excepción y se rechaza. La interfaz oculta los resultados inválidos y permite elegir otro sistema. El diagnóstico técnico aparece en la consola local, sin nombre, fecha ni coordenadas.

No existe todavía un módulo de partes, Fortuna ni Espíritu. No se agregaron fórmulas para simular que esas pruebas pasan. La actualización de partes dependientes de casas y la invariancia de partes independientes se deberán probar cuando ese módulo exista, bajo tus criterios.

## Comparación y pruebas

`COMPARACION-CASAS.md` contiene doce cúspides por cada uno de los cuatro sistemas en tres cartas y la distribución de los siete planetas y los nodos. Son 144 longitudes de cúspide contrastadas con swetest oficial. Incluye instrucciones para comparar con tu programa.

Pruebas del motor y HTTP: `python -m unittest discover -s tests -v` dentro del entorno instalado.

Pruebas gráficas y de orbes (Node 24): `npm run build` y `npm run test:wheel`.

Pruebas reales de navegador: iniciar `python server.py --port 8766 --test-ui` y abrir `http://127.0.0.1:8766/tests/browser.html`. Se ejecutan sobre la aplicación real en un iframe y verifican 1366 px, 390 px, controles, cuatro sistemas, SVG, PNG y error polar. Esta ruta está deshabilitada en el arranque normal.

## Fuentes y licencias

Los contornos proceden de Noto Sans, Noto Sans Symbols y Noto Sans Symbols 2, **SIL Open Font License 1.1**. Se entregan las fuentes originales, sus avisos y huellas de descarga. `src/glyphs.ts` conserva OFL, no se relicencia bajo AGPL. Cada SVG incluye los avisos completos en sus metadatos.

Se convierten números y glifos a trazados al desarrollar el programa. No se depende de fuentes remotas ni de que el destinatario tenga símbolos astrológicos instalados. `build_glyphs.py` permite regenerarlos con FontTools 4.61.1 (MIT), una herramienta de desarrollo que no es necesaria para ejecutar la aplicación.

Fuentes oficiales: [API de casas de Swiss Ephemeris](https://www.astro.com/swisseph/swephprg.htm), [Noto Sans OFL](https://github.com/google/fonts/blob/main/ofl/notosans/OFL.txt), [Noto Sans Symbols OFL](https://github.com/google/fonts/blob/main/ofl/notosanssymbols/OFL.txt), [Noto Sans Symbols 2 OFL](https://github.com/google/fonts/blob/main/ofl/notosanssymbols2/OFL.txt).

## Anillo de términos egipcios

Activado por defecto mediante Mostrar términos. Los 60 intervalos consultan los mismos JSON que las dignidades y la tabla completa. El marco SVG se amplía; se conservan las posiciones y el ASC izquierdo. Cursor, foco o toque muestran la regla y fuente. En teléfono ampliar al 300%. Ver `DIGNIDADES.md`.

## Lectura sexagesimal y movimiento

La tabla compacta muestra solo aspectos activos en cinco columnas: primer cuerpo, aspecto, segundo cuerpo, orbe (desviación respecto de la perfección) en D°MM′SS″ y movimiento. No hay detalles desplegables ni valores técnicos. El texto Aplicativo es un alias de la clasificación interna Aplicante, sin cambiar su cálculo. Orden por planeta o por orbe numérico; exportación CSV con los mismos aspectos y caracteres Unicode. Los valores internos no se redondean.

Movimiento instantáneo: se normaliza la diferencia longitudinal firmada a [-180°,180°); la derivada de la desviación es signo(separación mínima - ángulo exacto) × signo(diferencia firmada) × (velocidad B - velocidad A). Negativa: Aplicante; positiva: Separativo. Partil si la desviación es <= 10^-10 grados. Sin velocidades finitas, con diferencia de velocidades <= 10^-10 grados/día, o en el punto no diferenciable de separación mínima 0°/180° para otro aspecto: Indeterminado. Es un estado instantáneo; no predice una perfección futura ni incorpora recepciones u otras técnicas.
