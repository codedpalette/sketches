import { Container, DisplayObject, Graphics, Rectangle } from "pixi.js";
import { Sketch2D } from "../library/sketch";
import { glyphToPath, calculateGlyphBoundingBox, textToPath, pathToPoints } from "../library/svg";
import { drawPath, drawLines, LineLike } from "../library/drawing";
import * as paper from "paper";
import * as opentype from "opentype.js";
import { concaveHull } from "../library/geometry";

type FontFamily = {
  regular: opentype.Font;
  bold: opentype.Font;
  italic: opentype.Font;
  boldItalic: opentype.Font;
};

class WhoAmI extends Sketch2D {
  private mainFont: opentype.Font;
  private secondaryFonts: FontFamily[];
  private mainPaths: paper.CompoundPath[];

  constructor(mainFont: opentype.Font, secondaryFonts: FontFamily[], debug = false) {
    super(debug);
    this.mainFont = mainFont;
    this.secondaryFonts = secondaryFonts;
    this.mainPaths = [];
    paper.setup([this.width, this.height]);
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
    const path = glyphToPath(this.mainFont.charToGlyph(char));
    const boundingBox = calculateGlyphBoundingBox(path);
    const scaleX = lineHeight / boundingBox.width; //TODO: Maybe fix for very wide letters
    const scaleY = lineHeight / boundingBox.height;
    path.translate([-boundingBox.width / 2, -boundingBox.height / 2]);
    path.scale(scaleX, scaleY, [0, 0]);
    this.mainPaths.push(path);

    if (this.debug) {
      graphics.lineStyle(1, 0x00ff00);
      graphics.drawShape(calculateGlyphBoundingBox(path));
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
    const textPath = textToPath("Who am i", this.secondaryFonts[0].regular);
    const points = pathToPoints(textPath);
    const polygonHull = concaveHull(points);
    const graphics = new Graphics();
    graphics.lineStyle(1, 0x0000ff);
    drawPath(textPath, graphics);
    graphics.lineStyle(1, 0x00ff00);
    graphics.drawPolygon(polygonHull);
    return graphics;
  }

  setup(): Container<DisplayObject> {
    const lineHeight = 300;
    const lineMargin = 50;
    const margin = 10;

    const container = new Container();
    //container.addChild(this.generateMainText("ХТО", "Я?", lineHeight, lineMargin, margin));
    container.addChild(this.generateSecondaryText());
    return container;
  }
}

async function start() {
  const mainFont = await opentype.load("whoami/StalinistOne-Regular.ttf");
  const secondaryFonts = await Promise.all(
    ["Verdana", "Courier New", "Georgia"].map(async (fontName) => {
      const regular = await opentype.load(`whoami/${fontName}/${fontName}.ttf`);
      const bold = await opentype.load(`whoami/${fontName}/${fontName} Bold.ttf`);
      const italic = await opentype.load(`whoami/${fontName}/${fontName} Italic.ttf`);
      const boldItalic = await opentype.load(`whoami/${fontName}/${fontName} Bold Italic.ttf`);
      return {
        regular,
        bold,
        italic,
        boldItalic,
      };
    })
  );
  new WhoAmI(mainFont, secondaryFonts, true).draw();
}
start();
