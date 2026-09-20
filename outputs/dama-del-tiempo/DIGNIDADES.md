# Dignidades esenciales y términos egipcios

Sistema: **Dignidades tradicionales — términos egipcios**, con **triplicidades de Doroteo**. Datos corregidos y aprobados por el usuario: Aries usa límites 6, 12, 20, 25 y 30 grados; no se usan los términos ptolemaicos de Lilly.

## Datos y fuentes

La fuente editable única son cuatro JSON en `src/data/`. TypeScript copia estos JSON a `web/data/` al compilar. No editar las copias de distribución. La rueda, las tablas y el cálculo importan exactamente los mismos conjuntos.

- `rulerships.json`: domicilios, detrimentos, exaltaciones y caídas de Lilly, Christian Astrology (1647), p. 104. https://www.skyscript.co.uk/essential_dignities.html
- `egyptian-terms.json`: tabla separada «The Egyptian terms» de la misma página de Skyscript; no atribuida a los términos de Lilly p. 104.
- `triplicities.json`: Doroteo, Carmen Astrologicum I.1, traducción de Pingree. https://www.skyscript.co.uk/dorotheus1.pdf
- `faces.json`: orden caldeo, columna de faces de Lilly p. 104.

Cada conjunto lleva sistema, fuente, referencia, versión, intervalos y convención. La tabla completa está disponible sin calcular una carta.

## Reglas

Los intervalos son [inicio, fin), sobre longitudes sin redondear y normalizadas a [0,360). Exaltación y caída abarcan todo el signo; sus grados tradicionales no son requisitos. La fuente original de posiciones, casas y aspectos permanece intacta.

Secta: `sect.py` transforma las coordenadas solares ya calculadas a altura con `swe.azalt`. Se usa la altura geométrica del centro solar, sin refracción: >=0° diurna, <0° nocturna. Horizonte astronómico ideal, sin relieve ni elevación del observador. No se utiliza la hora civil ni la casa asignada al Sol.

Triplicidad activa: únicamente el regente principal correspondiente a la secta. Los tres regentes se muestran siempre. El participante se registra por separado, sin +3 automático ni exclusión de peregrinidad. Esta regla de aplicación está explícita en la interfaz.

Peregrino: carece de domicilio, exaltación, triplicidad principal activa, término y face propios. Detrimento y caída no anulan las dignidades positivas. Cada testimonio registra planeta, longitud, signo, resultado, regente, secta, sistema de términos, fuente, referencia, versión y explicación.

Puntuación opcional oculta al iniciar: «Puntuación según William Lilly». Domicilio +5, exaltación +4, triplicidad activa +3, término +2, face +1, detrimento -5, caída -4. Sin puntos al participante ni penalidad adicional por peregrinidad. Es una convención de suma, nunca reemplaza los testimonios.

## Rueda e interacción

Anillo exterior de 60 términos, activado por defecto. Usa las longitudes zodiacales originales y la misma rotación, con ASC a la izquierda. El marco SVG se amplía para alojarlo; no se desplazan planetas ni cúspides. Los glifos y números son contornos, también en PNG de 3300 píxeles. Mostrar términos permite ocultarlo.

Cada segmento muestra límites y glifo; 30° equivale al 0° del signo siguiente. Pasar el cursor, tocar o enfocar un segmento presenta signo, intervalo, regente, sistema y fuente. En teléfono usar ampliación 300% y desplazamiento; la explicación textual y tablas son la alternativa accesible para leer los límites exactos.

## Validación

164 pruebas aprobadas: 48 Python, 102 Node y 14 de navegador. Incluyen todos los domicilios/detrimentos/exaltaciones/caídas, triplicidades y participantes, 60 términos, 36 faces, límites exactos, peregrinidad, testimonios simultáneos, secta geométrica y cambio de casas, concordancia tabla/cálculo/anillo, interacción, ocultación, puntuación opcional, SVG/PNG, ausencia de recortes y colisiones de etiquetas de términos en vista móvil y escritorio.

Comandos: `npm run build`, `npm run test:wheel`, `.venv\Scripts\python.exe -m unittest discover -s tests`. Banco real: iniciar `server.py --port 8766 --test-ui` y abrir `/tests/browser.html`.

No se incorporan partes arábigas, recepciones, dignidades accidentales ni técnicas predictivas.
