import { Container, DisplayObject, Graphics, Rectangle } from "pixi.js";
import { Sketch2D } from "../library/sketch";
import { textToPath, Font, loadFont } from "../library/text";
import { pathToPoints } from "../library/geometry";
import { drawPath, drawLines, LineLike } from "../library/drawing";
import "../library/util";
import paper from "paper";
import { concaveHull } from "../library/geometry";

type FontFamily = {
  regular: Font;
  bold: Font;
  italic: Font;
  boldItalic: Font;
};

class WhoAmI extends Sketch2D {
  private mainFont: Font;
  private secondaryFonts: FontFamily[];
  private mainPaths: paper.CompoundPath[];
  private fallbackUnicodeFonts: Font[];

  constructor(mainFont: Font, secondaryFonts: FontFamily[], fallbackUnicodeFonts: Font[], debug = false) {
    super(debug);
    this.mainFont = mainFont;
    this.secondaryFonts = secondaryFonts;
    this.fallbackUnicodeFonts = fallbackUnicodeFonts;
    this.mainPaths = [];
    paper.setup([this.width, this.height]);
  }

  private calculateGlyphBoundingBox(path: paper.CompoundPath) {
    const data = path.data as { yFactor?: number; hFactor?: number };
    const yFactor = data.yFactor !== undefined ? data.yFactor : (data.yFactor = path.bounds.y / path.bounds.height);
    const heightFactor = data.hFactor || (data.hFactor = (path.bounds.height + path.bounds.y) / path.bounds.height);
    path.data = data;
    const boundingBox = new Rectangle(
      path.bounds.x,
      path.bounds.y - path.bounds.height * yFactor,
      path.bounds.width,
      path.bounds.height * heightFactor
    );
    return boundingBox;
  }

  private drawBaselines(lineHeight: number, lineMargin: number, margin: number): Graphics {
    const graphics = new Graphics();
    graphics.lineStyle(1, 0xff0000);
    const lines: LineLike[] = [
      [-this.width / 2, lineMargin, this.width / 2, lineMargin],
      [-this.width / 2, lineMargin + lineHeight, this.width / 2, lineMargin + lineHeight],
      [-this.width / 2, -lineMargin, this.width / 2, -lineMargin],
      [-this.width / 2, -lineMargin - lineHeight, this.width / 2, -lineMargin - lineHeight],
      [-this.width / 2 + margin, this.height / 2, -this.width / 2 + margin, -this.height / 2],
      [this.width / 2 - margin, this.height / 2, this.width / 2 - margin, -this.height / 2],
    ];
    drawLines(lines, graphics);
    return graphics;
  }

  private drawMainGlyph(x: number, y: number, char: string, lineHeight: number): Graphics {
    const graphics = new Graphics();
    const path = textToPath(char, this.mainFont)!;
    const boundingBox = this.calculateGlyphBoundingBox(path);
    const scaleX = lineHeight / boundingBox.width; //TODO: Maybe fix for very wide letters
    const scaleY = lineHeight / boundingBox.height;
    path.translate([-boundingBox.width / 2, -boundingBox.height / 2]);
    path.scale(scaleX, scaleY, [0, 0]);
    this.mainPaths.push(path);

    if (this.debug) {
      graphics.lineStyle(1, 0x00ff00);
      graphics.drawShape(this.calculateGlyphBoundingBox(path));
    }
    graphics.lineStyle(1, 0x0000ff);
    drawPath(path, graphics);
    graphics.position.set(x, y);
    return graphics;
  }

  private generateMainText(
    firstLine: string,
    secondLine: string,
    lineHeight: number,
    lineMargin: number,
    margin: number
  ): Container {
    const mainTextContainer = new Container();
    this.debug && mainTextContainer.addChild(this.drawBaselines(lineHeight, lineMargin, margin));
    const xStart = -this.width / 2 + margin;
    [firstLine, secondLine].forEach((line, lineIdx) => {
      const y = lineIdx == 0 ? lineMargin + lineHeight / 2 : -lineMargin - lineHeight / 2;
      const lineWidth = this.width - 2 * margin;
      const xStep = lineWidth / line.length;
      [...line].forEach((char, charIdx) => {
        const x = xStart + xStep * (charIdx + 0.5);
        mainTextContainer.addChild(this.drawMainGlyph(x, y, char, lineHeight));
      });
    });
    return mainTextContainer;
  }

  private generateSecondaryText(): Graphics {
    const text = "Who am i";
    let textPath = textToPath(text, this.secondaryFonts.random().regular);
    if (!textPath) {
      textPath = textToPath(text, this.fallbackUnicodeFonts.random())!; //TODO: if fails with fallback - blacklist the language
    }
    const points = pathToPoints(textPath);
    const polygonHull = concaveHull(points);
    const graphics = new Graphics();
    graphics.lineStyle(1, 0x0000ff);
    drawPath(textPath, graphics);
    if (this.debug) {
      graphics.lineStyle(1, 0x00ff00);
      graphics.drawPolygon(polygonHull);
    }
    return graphics;
  }

  setup(): Container<DisplayObject> {
    const lineHeight = 300;
    const lineMargin = 50;
    const margin = 10;

    const container = new Container();
    container.addChild(this.generateMainText("ХТО", "Я?", lineHeight, lineMargin, margin));
    container.addChild(this.generateSecondaryText());
    return container;
  }
}

async function start() {
  const mainFont = await loadFont("whoami/StalinistOne-Regular.ttf");
  const secondaryFonts = await Promise.all(
    ["Verdana", "Courier New", "Georgia"].map(async (fontName) => {
      const regular = await loadFont(`whoami/${fontName}/${fontName}.ttf`);
      const bold = await loadFont(`whoami/${fontName}/${fontName} Bold.ttf`);
      const italic = await loadFont(`whoami/${fontName}/${fontName} Italic.ttf`);
      const boldItalic = await loadFont(`whoami/${fontName}/${fontName} Bold Italic.ttf`);
      return {
        regular,
        bold,
        italic,
        boldItalic,
      };
    })
  );
  const fallbackUnicodeFont = await loadFont("whoami/GoNotoCurrent.ttf");
  const fallbackUnicodeFontSerif = await loadFont("whoami/GoNotoCurrentSerif.ttf");
  new WhoAmI(mainFont, secondaryFonts, [fallbackUnicodeFont, fallbackUnicodeFontSerif], true).draw();
}
void start();
