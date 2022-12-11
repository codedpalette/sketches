import paper from "paper";
import opentype from "opentype.js";

export type Font = opentype.Font;

function pathDataToPath(pathData: string): paper.CompoundPath {
  const path = new paper.CompoundPath(pathData);
  path.scale(1, -1, [0, 0]);
  path.translate([-path.bounds.x, 0]);
  return path;
}

function textToPath(text: string, font: Font, fontSize = 72): paper.CompoundPath | undefined {
  const glyphs = [];
  for (let i = 0; i < font.glyphs.length; i++) {
    glyphs.push(font.glyphs.get(i));
  }
  const supportedUnicodes = new Set(glyphs.flatMap((glyph) => glyph.unicodes));
  for (let j = 0; j < text.length; j++) {
    if (!supportedUnicodes.has(text.charCodeAt(j))) {
      return undefined;
    }
  }
  return pathDataToPath(font.getPath(text, 0, 0, fontSize).toPathData(2));
}

async function loadFont(path: string): Promise<Font> {
  const font = await opentype.load(path);
  return font;
}

export { textToPath, loadFont };
