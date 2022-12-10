import { Graphics } from "pixi.js";
import * as paper from "paper";

export type LineLike = [number, number, number, number] | { x1: number; y1: number; x2: number; y2: number };

function drawLines(lines: LineLike[], graphics: Graphics) {
  lines.forEach((line) => {
    const [x1, y1, x2, y2] = line instanceof Array ? line : [line.x1, line.y1, line.x2, line.y2];
    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
  });
}

function drawPath(path: paper.CompoundPath, graphics: Graphics) {
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
}

export { drawLines, drawPath };
