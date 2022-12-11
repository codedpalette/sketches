import { Graphics } from "pixi.js";
import paper from "paper";

export type LineLike = [number, number, number, number] | { x1: number; y1: number; x2: number; y2: number };

function drawLines(lines: LineLike[], graphics: Graphics) {
  lines.forEach((line) => {
    const [x1, y1, x2, y2] = line instanceof Array ? line : [line.x1, line.y1, line.x2, line.y2];
    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
  });
}

// based on https://github.com/paperjs/paper.js/blob/56d153aa978255b8301c9f1ef37bafa5ac69c5cd/src/path/Path.js#L2227
function drawPath(path: paper.CompoundPath, graphics: Graphics) {
  for (const childPath of path.children as paper.Path[]) {
    let first = true;
    let [curX, curY, prevX, prevY, inX, inY, outX, outY]: number[] = [];
    for (const segment of childPath.segments) {
      [curX, curY] = [segment.point.x, segment.point.y];
      if (first) {
        graphics.moveTo(curX, curY);
        first = false;
      } else {
        const handle = segment.handleIn;
        [inX, inY] = [curX + handle.x, curY + handle.y];
        if (inX === curX && inY === curY && outX === prevX && outY === prevY) {
          graphics.lineTo(curX, curY);
        } else {
          graphics.bezierCurveTo(outX, outY, inX, inY, curX, curY);
        }
      }
      [prevX, prevY] = [curX, curY];
      const handle = segment.handleOut;
      [outX, outY] = [prevX + handle.x, prevY + handle.y];
    }
    childPath.closed && graphics.closePath();
  }
}

export { drawLines, drawPath };
