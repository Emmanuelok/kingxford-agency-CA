"""Build Avalon’s outlined AV identity. No runtime font dependencies."""
from pathlib import Path
import re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'brand'
OUT.mkdir(parents=True, exist_ok=True)
(ROOT / 'docs' / 'brand').mkdir(parents=True, exist_ok=True)
CORAL = '#ed4b35'
INK = '#202523'
IVORY = '#f5f2eb'
SYMBOL = 'M8 152 67 16h36l41 96 41-96h36l-59 136h-36L85 56 44 152Z M44 108h65l12 28H32Z'

font = TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
glyphset = font.getGlyphSet()
cmap = font.getBestCmap()
caption = []
x = 0
caption_scale = 48 / font['head'].unitsPerEm
caption_text = 'CREATIVES GROUP'
tracking = (742 / caption_scale - sum(glyphset[cmap[ord(c)]].width for c in caption_text)) / (len(caption_text) - 1)
for char in caption_text:
    glyph = glyphset[cmap[ord(char)]]
    pen = SVGPathPen(glyphset)
    glyph.draw(pen)
    caption.append(f'<path d="{pen.getCommands()}" transform="translate({x} 0)"/>')
    x += glyph.width + tracking
caption = f'<g transform="translate(306 224) scale({caption_scale} {-caption_scale})">{"".join(caption)}</g>'

source = (ROOT / 'components' / 'avalon-wordmark.tsx').read_text()
glyphs = re.findall(r'key: "[^"]+",\s+x: (\d+),\s+sourceX: (\d+),\s+width: \d+,\s+outline: "([^"]+)"', source)
letters = ''.join(f'<path d="{d}" transform="translate({int(pos)-int(origin)} 0)" fill-rule="evenodd"/>' for pos, origin, d in glyphs)
wordmark = f'<g transform="translate(306 27) scale(.198)">{letters}</g>'

def contents(ink):
    return f'<path d="{SYMBOL}" fill="{CORAL}" transform="translate(0 43)"/><g fill="{ink}">{wordmark}{caption}</g>'

def wrap(body, view='0 0 1060 240', title='Avalon Creatives Group'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img" aria-label="{title}">{body}</svg>\n'

for label, ink in [('dark', INK), ('light', IVORY)]:
    (OUT / f'avalon-logo-{label}.svg').write_text(wrap(contents(ink)))
    (OUT / f'avalon-logo-mono-{label}.svg').write_text(wrap(contents(ink).replace(CORAL, ink)))
(OUT / 'avalon-symbol.svg').write_text(wrap(f'<path d="{SYMBOL}" fill="{CORAL}"/>', '0 0 230 168'))
(ROOT / 'public' / 'favicon.svg').write_text(wrap(f'<rect width="64" height="64" rx="14" fill="{INK}"/><path d="{SYMBOL}" fill="{IVORY}" transform="translate(5 12) scale(.24)"/>', '0 0 64 64'))

jsx = contents('currentColor').replace('fill-rule=', 'fillRule=')
(ROOT / 'components' / 'avalon-logo.tsx').write_text('''/** Outlined master identity; stays sharp from the navigation to large displays. */
export function AvalonLogo({ className = "avalon-brand-logo" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1060 240" width="1060" height="240" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      ''' + jsx + '''
    </svg>
  );
}
''')

# An inspection board and clean reference for the social artwork.
(ROOT / 'docs' / 'brand' / 'avalon-logo-presentation.svg').write_text(wrap(f'<rect width="1600" height="900" fill="{IVORY}"/><g transform="translate(166 120) scale(1.2)">{contents(INK)}</g><rect x="0" y="450" width="1600" height="450" fill="{INK}"/><g transform="translate(166 570) scale(1.2)">{contents(IVORY)}</g>', '0 0 1600 900'))
print('Created outlined logo masters, symbol, favicon, component and presentation.')
