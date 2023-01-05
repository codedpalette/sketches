import { drawPath } from "drawing/helpers";
import { Sketch2D } from "drawing/sketch";
import { deg, fromPolar } from "math/angles";
import { max, min, multiply, sign, sin, tan } from "mathjs";
import { Color, CompoundPath, Path, Point, Rectangle } from "paper";
import { Container, DisplayObject } from "pixi.js";

class Stripes extends Sketch2D {
  constructor(debug = false) {
    super(debug);
  }

  protected setup(): Container<DisplayObject> {
    const container = new Container();
    const rect = this.generateRect().toPath();
    rect.fillColor = new Color("black");

    const { lines, segments } = this.generateStripes();
    const stripedRect = rect.intersect(segments) as CompoundPath;
    container.addChild(drawPath(stripedRect));

    if (this.debug) {
      lines.strokeColor = new Color("blue");
      container.addChild(drawPath(lines));
    }

    return container;
  }

  private generateRect(): Rectangle {
    const halfDim = min(this.width, this.height) / 2;
    const corner = new Point(multiply(halfDim, [-this.random.real(0.5, 0.9), this.random.real(0.5, 0.9)]));
    return new Rectangle(corner, [-corner.x * 2, -corner.y * 2]);
  }

  private generateStripes(): { lines: CompoundPath; segments: CompoundPath } {
    //TODO: Make corners always visible (with offset?)
    const lines = [],
      segments = [];
    const slopeDeg = this.random.real(20, 70);
    const slope = tan(deg(slopeDeg)) * (this.random.bool() ? 1 : -1);

    const lineDist = this.random.integer(100, 150);
    const interceptStep = lineDist / sin(deg(90 - slopeDeg));
    const halfLineWidth = lineDist * 0.5 * this.random.real(0.6, 0.8);
    const lineWidthOffset = fromPolar(halfLineWidth, deg(90 + slopeDeg * sign(slope)));

    const [fromX, toX] = multiply(this.width, [-2, 2]);
    const interceptBounds = multiply([fromX, toX], -slope);
    for (let intercept = min(interceptBounds); intercept < max(interceptBounds); intercept += interceptStep) {
      const from = new Point(fromX, slope * fromX + intercept);
      const to = new Point(toX, slope * toX + intercept);
      lines.push(new Path.Line(from, to));

      const segmentPoints = [
        from.add(lineWidthOffset),
        to.add(lineWidthOffset),
        to.subtract(lineWidthOffset),
        from.subtract(lineWidthOffset),
      ];
      segments.push(new Path({ segments: segmentPoints, closed: true }));
    }
    return { lines: new CompoundPath({ children: lines }), segments: new CompoundPath({ children: segments }) };
  }
}

new Stripes(true).draw();
