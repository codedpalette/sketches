import { drawPath } from "drawing/helpers";
import { Sketch2D } from "drawing/sketch";
import { Color, CompoundPath, Line, Path, Point, Rectangle } from "geometry/paper";
import { deg } from "math/angles";
import { multiply, sin, subtract, tan } from "mathjs";
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
    const halfDim = Math.min(this.width, this.height) / 2;
    const corner = new Point(-halfDim * this.random.real(0.5, 0.9), halfDim * this.random.real(0.5, 0.9));
    return new Rectangle(corner, [-corner.x * 2, -corner.y * 2]);
  }

  private generateStripes(): { lines: CompoundPath; segments: CompoundPath } {
    const lines = [],
      segments = [];
    const slopeDeg = deg(this.random.real(20, 70));
    const slope = tan(slopeDeg) * (this.random.bool() ? 1 : -1);
    const root = Math.sqrt(1 + slope * slope);

    const lineDist = this.random.integer(100, 150);
    const halfLineWidth = lineDist * 0.5 * this.random.real(0.6, 0.8);
    const interceptStep = lineDist / sin(subtract(deg(90), slopeDeg)); //TODO: Make corners always visible (with offset?)
    const [lineWidthX, lineWidthY] = [(halfLineWidth * slope) / root, halfLineWidth / root]; //TODO: Convert using fromPolar
    //const { x: lineWidthX, y: lineWidthY } = fromPolar(halfLineWidth, (90 - slopeDeg) as Degrees);

    const [fromX, toX] = [-this.width, this.width]; 
    const [minIntercept, maxIntercept] = multiply(slope > 0 ? [toX, fromX] : [fromX, toX], -slope) as [number, number];

    for (let intercept = minIntercept; intercept < maxIntercept; intercept += interceptStep) {
      const from = new Point(fromX, slope * fromX + intercept);
      const to = new Point(toX, slope * toX + intercept);
      const line = new Line(from, to);
      lines.push(line);

      //TODO: use vectors
      const segmentPoints = [
        new Point(from.x - lineWidthX, from.y + lineWidthY),
        new Point(to.x - lineWidthX, to.y + lineWidthY),
        new Point(to.x + lineWidthX, to.y - lineWidthY),
        new Point(from.x + lineWidthX, from.y - lineWidthY),
      ];
      segments.push(new Path({ segments: segmentPoints, closed: true }));
    }

    return { lines: new CompoundPath({ children: lines }), segments: new CompoundPath({ children: segments }) };
  }
}

new Stripes(true).draw();
