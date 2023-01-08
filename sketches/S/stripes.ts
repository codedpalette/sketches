import { drawPath } from "drawing/helpers";
import { Sketch2D } from "drawing/sketch";
import { Color, CompoundPath, Line, Path, Point, Rectangle } from "geometry";
import { deg, fromPolar } from "math/angles";
import { max, min, multiply, sign, sin, tan } from "mathjs";
import { Container, DisplayObject } from "pixi.js";
import { random } from "util/random";

class Stripes extends Sketch2D {
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
    const randomBounds = [0.5, 0.9] as const;
    const corner = new Point(multiply(halfDim, [-random.real(...randomBounds), random.real(...randomBounds)]));
    return new Rectangle(corner, [-corner.x * 2, -corner.y * 2]);
  }

  private generateStripes(): { lines: CompoundPath; segments: CompoundPath } {
    const lines = [],
      segments = [];
    const slopeDeg = random.real(20, 70);
    const slope = tan(deg(slopeDeg)) * random.sign();

    const lineDist = random.integer(100, 150);
    const interceptStep = lineDist / sin(deg(90 - slopeDeg));
    const halfLineWidth = lineDist * 0.5 * random.real(0.6, 0.8);
    const lineWidthOffset = fromPolar(halfLineWidth, deg(90 + slopeDeg * sign(slope)));

    const [fromX, toX] = multiply(this.width, [-2, 2]);
    const interceptBounds = multiply([fromX, toX], -slope);
    for (let intercept = min(interceptBounds); intercept < max(interceptBounds); intercept += interceptStep) {
      const from = new Point(fromX, slope * fromX + intercept);
      const to = new Point(toX, slope * toX + intercept);
      lines.push(new Line(from, to));

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

new Stripes({ debug: true }).run();
