import paper from "paper";
import fontkit from "@pdf-lib/fontkit";
import "regenerator-runtime/runtime";

export type Font = fontkit.Font;

function textToPath(text: string, font: Font, fontSize = 72): paper.CompoundPath | undefined {
  for (let j = 0; j < text.length; j++) {
    if (!font.hasGlyphForCodePoint(text.charCodeAt(j))) {
      return undefined;
    }
  }
  let layout: fontkit.GlyphRun;
  try {
    layout = font.layout(text);
  } catch (e) {
    console.error(`text = ${text}, font = ${font.fullName as string}`);
    return undefined;
  }
  let penPosition = [0, 0];
  const childPaths = layout.glyphs.map((glyph, i) => {
    const glyphPath = new paper.CompoundPath(glyph.path.toSVG());
    const glyphPosition = layout.positions[i];
    const scale = (1 / (font.unitsPerEm || 1000)) * fontSize;
    glyphPath.translate([penPosition[0] + glyphPosition.xOffset, penPosition[1] + glyphPosition.yOffset]);
    glyphPath.scale(scale, [0, 0]);
    penPosition = [penPosition[0] + glyphPosition.xAdvance, penPosition[1] + glyphPosition.yAdvance];
    return glyphPath;
  });
  return new paper.CompoundPath(childPaths);
}

async function loadFont(path: string): Promise<Font> {
  const arrayBuffer = await (await (await fetch(`http://localhost:1234/${path}`)).blob()).arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const font = fontkit.create(buffer);
  return font;
}

export { textToPath, loadFont };
