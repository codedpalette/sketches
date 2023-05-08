import { create, GlyphRun, Font as FontKitFont } from "fontkit";
import { CompoundPath } from "geometry/paths";

export type Font = FontKitFont;

export function textToPath(text: string, font: Font, removeOffset = false, fontSize = 72): CompoundPath | undefined {
  // Check if font has glyphs for all characters in text
  for (let j = 0; j < text.length; j++) {
    if (!font.hasGlyphForCodePoint(text.charCodeAt(j))) {
      return undefined;
    }
  }

  // Try to convert text to glyphs
  let layout: GlyphRun;
  try {
    layout = font.layout(text);
  } catch (e) {
    console.error(`Layout failed: text = ${text}, font = ${font.fullName}`);
    return undefined;
  }

  // Render text to path
  let penPosition = [0, 0];
  const childPaths = layout.glyphs.map((glyph, i) => {
    const glyphPath = new CompoundPath(glyph.path.toSVG());
    const glyphPosition = layout.positions[i];
    const scale = (1 / (font.unitsPerEm || 1000)) * fontSize;

    removeOffset && glyphPath.translate([-glyphPath.bounds.x, 0]);
    glyphPath.translate([penPosition[0] + glyphPosition.xOffset, penPosition[1] + glyphPosition.yOffset]);
    glyphPath.scale(scale, [0, 0]);
    penPosition = [penPosition[0] + glyphPosition.xAdvance, penPosition[1] + glyphPosition.yAdvance];
    return glyphPath;
  });
  return new CompoundPath(childPaths);
}

export async function loadFont(path: string): Promise<Font> {
  const arrayBuffer = await (await (await fetch(`http://localhost:1234/${path}`)).blob()).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const font = create(buffer);
  return font;
}
