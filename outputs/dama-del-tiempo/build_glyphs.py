"""Regenerar con fonttools==4.61.1 (MIT). Solo desarrollo, no uso de la app.
Los contornos derivados de Noto mantienen SIL OFL 1.1; ver licenses/.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
import json

ROOT=Path(__file__).parent
fonts=[TTFont(ROOT/'vendor-sources/fonts'/name) for name in ['Text.ttf','Symbols1.ttf','Symbols.ttf']]
chars=set('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz °′℞☉☽☿♀♂♃♄☊☋♈♉♊♋♌♍♎♏♐♑♒♓·−:.,/áéíóúñÁÉÍÓÚÑ–')
lots=json.loads((ROOT/'src/data/lots-catalog.json').read_text(encoding='utf-8'))
chars.update(''.join(row['nameSpanish'] for row in lots['records']))
glyphs={}
for char in sorted(chars):
    font=next((font for font in fonts if ord(char) in font.getBestCmap()),None)
    if font is None:raise ValueError(f'Glifo no disponible: {char}')
    name=font.getBestCmap()[ord(char)];gs=font.getGlyphSet();glyph=gs[name]
    pen=SVGPathPen(gs);glyph.draw(pen)
    bounds=BoundsPen(gs);glyph.draw(bounds)
    glyphs[char]={'d':pen.getCommands(),'advance':glyph.width,'units':font['head'].unitsPerEm,'bounds':bounds.bounds}
license_text='\n'.join((ROOT/'licenses'/name).read_text(encoding='utf-8') for name in ['notosans-OFL.txt','notosanssymbols-OFL.txt','notosanssymbols2-OFL.txt'])
(ROOT/'src/glyphs.ts').write_text('// Contornos derivados de Noto. SIL OFL 1.1; no AGPL. Generado por build_glyphs.py.\nexport const fontLicense = '+json.dumps(license_text)+';\nexport const glyphs: Record<string, {d:string;advance:number;units:number;bounds:number[]|null}> = '+json.dumps(glyphs,ensure_ascii=False)+';\n',encoding='utf-8')
print(f'{len(glyphs)} glifos, cobertura completa.')
