import { Rectangle } from "geometry/paths";
import { min } from "mathjs";
import { random } from "util/random";

export function rectanglePacking(boundsRect: Rectangle, gridStep: number): Rectangle[] {
  const rects = [boundsRect];

  const size = min(boundsRect.width, boundsRect.height);
  const step = size / gridStep;
  for (let i = 0; i < size; i += step) {
    splitRectsWith({ y: i }, rects);
    splitRectsWith({ x: i }, rects);
  }
  return rects;
}

type PointLike = { x?: number; y?: number };

function splitRectsWith(point: PointLike, rects: Rectangle[]) {
  const { x, y } = point;

  for (let i = rects.length - 1; i >= 0; i--) {
    const rect = rects[i];
    if (x && x > rect.left && x < rect.right) {
      if (random.realZeroToOneInclusive() > 0.5) {
        const splitAt = x;
        rects.splice(i, 1);
        rects.push(new Rectangle(rect.x, rect.y, splitAt - rect.x, rect.height));
        rects.push(new Rectangle(splitAt, rect.y, rect.width - splitAt + rect.x, rect.height));
      }
    }
    if (y && y > rect.top && y < rect.bottom) {
      if (random.realZeroToOneInclusive() > 0.5) {
        const splitAt = y;
        rects.splice(i, 1);
        rects.push(new Rectangle(rect.x, rect.y, rect.width, splitAt - rect.y));
        rects.push(new Rectangle(rect.x, splitAt, rect.width, rect.height - splitAt + rect.y));
      }
    }
  }
}
