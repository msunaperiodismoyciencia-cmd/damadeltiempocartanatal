# Rediseño de presentación

Cuatro áreas: Nueva carta, Carta, Análisis y Guardadas. Navegación superior en escritorio e inferior en móvil. Análisis muestra una sola pestaña cada vez: Posiciones, Aspectos, Dignidades, Términos, Lotes o Técnicas predictivas.

## Componentes reutilizables
- Panel: `panel()` y `.ui-panel`.
- Pestañas: `tabs()`, roles ARIA, flechas izquierda/derecha, Inicio y Fin.
- Tabla astrológica: `.ui-table`, cifras tabulares y contenedores desplazables con foco.
- Botón principal: `.ui-primary`.
- Campo de formulario: `.ui-field`, etiquetas existentes y estado aria-invalid.
- Acordeón: `accordion()` y `.ui-accordion`, sobre details/summary nativos.
- Mensaje de error: `.ui-error`, role alert y mensajes de validación del navegador en contexto.
- Estado vacío: `emptyState()` y `.ui-empty`.

La capa `src/presentation.ts` mueve los nodos existentes conservando sus identificadores, datos y eventos. No sustituye formularios ni módulos de cálculo. Los resultados de la carta siguen gobernados por el estado original de `#results`; la capa visual solo refleja su disponibilidad.

## Archivos cambiados
- Nuevo `src/presentation.ts` y su compilado `web/presentation.js`.
- `web/index.html`: carga del módulo visual.
- `web/style.css`: sistema visual y adaptación responsive.
- `server.py`: autorización de la ruta estática de presentation.js; ninguna ruta de cálculo modificada.
- `tests/browser.js`: tres pruebas adicionales de presentación.
- Este informe.

## Validación
262 pruebas aprobadas: 189 JavaScript, 48 Python, 25 navegador. Se ejecutaron las pruebas anteriores, además de navegación por las cuatro áreas, pestañas de análisis, teclado, mensajes de error y ausencia de desbordamiento general en 360, 768 y 1366 px. La rueda encaja al ancho; la ampliación manual permite inspeccionarla dentro de un contenedor desplazable.

Los hashes de todos los archivos previos de src (incluidos catálogos, regencias y datos) y de todos los módulos Python de cálculo permanecen idénticos. No se modificó ninguna fórmula, lógica astrológica, dato tradicional, catálogo ni motor de efemérides. No se eliminaron funcionalidades. Guardadas permanece vacía y no persiste cartas.
