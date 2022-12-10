import { Container, DisplayObject, Graphics, Rectangle } from "pixi.js";
import { Sketch2D } from "../library/sketch";
import * as paper from "paper";
import * as opentype from "opentype.js";

class WhoAmI extends Sketch2D {
  font: opentype.Font;
  debug: boolean;
  mainPaths: paper.CompoundPath[];

  constructor(font: opentype.Font, debug = false) {
    super();
    this.font = font;
    this.debug = debug;
    this.mainPaths = [];
    paper.setup([this.width, this.height]);
  }

  private glyphToPath(glyph: opentype.Glyph): paper.CompoundPath {
    const path = new paper.CompoundPath(glyph.getPath().toPathData(2));
    path.scale(1, -1, [0, 0]);
    path.translate([-path.bounds.x, 0]);
    return path;
  }

  private calculateBoundingBox(path: paper.CompoundPath) {
    const yFactor =
      path.data.yFactor !== undefined ? path.data.yFactor : (path.data.yFactor = path.bounds.y / path.bounds.height);
    const heightFactor =
      path.data.heightFactor || (path.data.heightFactor = (path.bounds.height + path.bounds.y) / path.bounds.height);
    const boundingBox = new Rectangle(
      path.bounds.x,
      path.bounds.y - path.bounds.height * yFactor,
      path.bounds.width,
      path.bounds.height * heightFactor
    );
    return boundingBox;
  }

  private drawMainGlyph(x: number, y: number, char: string, lineHeight: number): Graphics {
    const graphics = new Graphics();
    const path = this.glyphToPath(this.font.charToGlyph(char));
    const boundingBox = this.calculateBoundingBox(path);
    const scaleX = lineHeight / boundingBox.width; //TODO: Maybe fix for very wide letters
    const scaleY = lineHeight / boundingBox.height;
    path.translate([-boundingBox.width / 2, -boundingBox.height / 2]);
    path.scale(scaleX, scaleY, [0, 0]);
    this.mainPaths.push(path);

    if (this.debug) {
      graphics.lineStyle(1, 0x00ff00);
      graphics.drawShape(this.calculateBoundingBox(path));
    }
    graphics.lineStyle(1, 0x0000ff);
    for (let curve of path.curves) {
      graphics.moveTo(curve.segment1.point.x, curve.segment1.point.y);
      graphics.bezierCurveTo(
        curve.point1.x,
        curve.point1.y,
        curve.point2.x,
        curve.point2.y,
        curve.segment2.point.x,
        curve.segment2.point.y
      );
    }
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
    this.debug && mainTextContainer.addChild(this.drawBaselines(lineHeight, lineMargin, margin));
    return mainTextContainer;
  }

  private drawBaselines(lineHeight: number, lineMargin: number, margin: number): Graphics {
    const graphics = new Graphics();
    graphics.lineStyle(1, 0xff0000);
    const lines = [
      [-this.width / 2, lineMargin, this.width / 2, lineMargin],
      [-this.width / 2, lineMargin + lineHeight, this.width / 2, lineMargin + lineHeight],
      [-this.width / 2, 0, this.width / 2, 0],
      [-this.width / 2, -lineMargin, this.width / 2, -lineMargin],
      [-this.width / 2, -lineMargin - lineHeight, this.width / 2, -lineMargin - lineHeight],
      [-this.width / 2 + margin, this.height / 2, -this.width / 2 + margin, -this.height / 2],
      [0, this.height / 2, 0, -this.height / 2],
      [this.width / 2 - margin, this.height / 2, this.width / 2 - margin, -this.height / 2],
    ];
    lines.forEach((line) => {
      const [x1, y1, x2, y2] = line;
      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
    });
    return graphics;
  }

  setup(): Container<DisplayObject> {
    const lineHeight = 300;
    const lineMargin = 50;
    const margin = 10;

    const container = new Container();
    container.addChild(this.generateMainText("ХТО", "Я?", lineHeight, lineMargin, margin));
    return container;
  }
}

opentype.load("whoami/StalinistOne-Regular.ttf", (err, font) => {
  font ? new WhoAmI(font, true).draw() : console.error(err);
});
