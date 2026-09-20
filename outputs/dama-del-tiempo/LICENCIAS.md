# Licencias y obligaciones

Se elige **GNU Affero General Public License versión 3 (AGPL-3.0-only)** para Dama del Tiempo y la modalidad AGPL de Swiss Ephemeris. No se adquirió ni se necesita la licencia profesional para esta distribución compatible con AGPL.

## Dependencias directas

| Componente | Versión usada | Licencia / condiciones |
|---|---|---|
| Código de Dama del Tiempo | 0.1.0 | AGPL-3.0-only; texto completo en LICENSE |
| Swiss Ephemeris, biblioteca y efemérides | 2.10.03; archivos sepl_18 y semo_18 | Opción AGPLv3 de su licencia dual; aviso original en licenses/Swiss-Ephemeris.txt |
| pyswisseph | 2.10.3.2 | AGPLv3; distribución fuente completa incluida en vendor-sources |
| Python | 3.11 | PSF; biblioteca estándar, sin framework web adicional |
| tzdata | 2026.2 | Apache-2.0 para paquete, datos IANA de dominio público; avisos en licenses |
| TypeScript (solo desarrollo) | 5.9.3 | Apache-2.0; aviso original en licenses |
| Noto Sans / Symbols / Symbols 2 | Fuentes fijadas por SHA-256 | SIL OFL 1.1; archivos originales y avisos incluidos; contornos derivados conservan OFL |
| FontTools (solo para regenerar contornos) | 4.61.1 | MIT; no se requiere para ejecutar la aplicación |
| Open-Meteo / GeoNames (servicio opcional) | API v1 | Datos CC BY 4.0 según Open-Meteo; GeoNames CC BY; API gratuita solo para uso no comercial y con límites |

No hay dependencias de pago ni paquetes de IA. Python, TypeScript y tzdata tienen licencias compatibles con esta arquitectura AGPL. El servicio externo conserva sus condiciones propias; no se relicencia bajo AGPL.

## Qué exige AGPL en este proyecto

- Conservar los avisos de copyright, licencia y ausencia de garantía. No eliminar el aviso de Swiss Ephemeris.
- Al entregar versiones del programa, conservar AGPL y entregar el código fuente correspondiente, incluidos los cambios, los archivos necesarios para compilar y las instrucciones de instalación. No imponer condiciones adicionales que quiten libertades otorgadas por AGPL.
- Marcar las modificaciones y fechas pertinentes cuando se modifiquen componentes recibidos de terceros. Esta etapa no modifica el código de Swiss Ephemeris ni pyswisseph.
- Si se ofrece una versión modificada para uso por red, ofrecer de forma visible a los usuarios remotos el código fuente correspondiente sin cargo, conforme a la sección 13. La interfaz incorpora «Descargar código fuente» con los fuentes, reglas, pruebas, instrucciones y efemérides de esta versión. Si se cambia la forma de alojamiento, hay que mantener actualizada esa descarga.
- No sustituir la entrega de código por solo archivos compilados u ofuscados. Esta entrega incluye TypeScript original y JavaScript compilado; también el código fuente de pyswisseph, que contiene la biblioteca C de Swiss Ephemeris usada por el paquete.
- Mantener los avisos y licencias de los demás componentes. Los nombres de los autores de Swiss Ephemeris se incluyen únicamente en sus avisos de copyright, no como promoción o aval del producto.

AGPL permite distribuir, estudiar, modificar y usar comercialmente software cumpliendo sus condiciones; eso no amplía la autorización de la API gratuita de Open-Meteo. El proyecto debe seguir funcionando sin esa API mediante entrada manual o su sustitución.

Los textos completos originales son los que rigen; este documento es una explicación práctica para mantener el proyecto. Fuentes: [licencia oficial Swiss Ephemeris](https://github.com/aloistr/swisseph/blob/master/LICENSE), [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html), [condiciones Open-Meteo](https://open-meteo.com/en/terms).
