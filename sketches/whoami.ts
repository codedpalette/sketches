import { Container, DisplayObject, Graphics, Rectangle } from "pixi.js";
import { Sketch2D } from "../library/sketch";
import { Path, PaperScope } from "paper";
import * as opentype from "opentype.js";

class WhoAmI extends Sketch2D {
  font: opentype.Font;
  debug: boolean;

  constructor(font: opentype.Font, debug = false) {
    super();
    this.font = font;
    this.debug = debug;
    const scope = new PaperScope();
    scope.setup([this.width, this.height]);
  }

  private generateMainText(firstLine: string, secondLine: string, lineHeight: number, margin: number): Graphics {
    [firstLine, secondLine].forEach((line, lineIdx) => {
      const y = lineIdx == 0 ? lineHeight / 2 : -lineHeight / 2;
      const lineWidth = this.width - 2 * margin;
      [...line].forEach((char, charIdx) => {});
    });

    const glyph = this.font.charToGlyph("Х");
    const path = new Path(glyph.getPath().toPathData(2));
    const boundingBox = new Rectangle(path.bounds.x, path.bounds.y, path.bounds.width, path.bounds.height);
    const curves = path.curves;

    const scale = 300 / boundingBox.height;
    path.translate([-boundingBox.width / 2, boundingBox.height / 2]);
    path.scale(scale, -scale);

    const graphics = new Graphics();
    graphics.lineStyle(1, 0x0000ff);
    for (let curve of curves) {
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
    if (this.debug) {
      graphics.lineStyle(1, 0x00ff00);
      graphics.drawShape(graphics.getBounds());
    }

    graphics.position.set(0, 150);
    return graphics;
  }

  private drawBaselines(height: number, margin: number): Graphics {
    const graphics = new Graphics();
    graphics.lineStyle(1, 0xff0000);
    const lines = [
      [-this.width / 2, height, this.width / 2, height],
      [-this.width / 2, 0, this.width / 2, 0],
      [-this.width / 2, -height, this.width / 2, -height],
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
    const margin = 10;

    const container = new Container();
    this.debug && container.addChild(this.drawBaselines(lineHeight, margin));
    container.addChild(this.generateMainText("ХТО", "Я?", lineHeight, margin));
    return container;
  }
}

opentype.load("whoami/StalinistOne-Regular.ttf", (err, font) => {
  font ? new WhoAmI(font, true).draw() : console.error(err);
});
