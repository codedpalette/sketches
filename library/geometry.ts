import hull from "hull.js";
import { Polygon } from "pixi.js";

function concaveHull(points: paper.Point[], concavity = 50): Polygon {
  const pointArrays = [];
  for (const point of points) {
    pointArrays.push([point.x, point.y]);
  }
  const shape = hull(pointArrays, concavity) as number[][];
  return new Polygon(shape.map((point) => ({ x: point[0], y: point[1] })));
}

function pathToPoints(path: paper.CompoundPath): paper.Point[] {
  const points = [];
  const step = 3;
  for (const childPath of path.children as paper.Path[]) {
    const pathLength = childPath.length;
    for (let i = 0; i < pathLength; i += step) {
      points.push(childPath.getPointAt(i));
    }
  }
  return points;
}

export { concaveHull, pathToPoints };
