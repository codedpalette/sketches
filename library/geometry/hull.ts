import hull from "hull.js";
import { Point, Path, CompoundPath } from "../paper";

function pathToPoints(path: CompoundPath, step = 1): Point[] {
  const points = [];
  for (const childPath of path.children as Path[]) {
    const pathLength = childPath.length;
    for (let i = 0; i < pathLength; i += step) {
      points.push(childPath.getPointAt(i));
    }
  }
  return points;
}

function concaveHull(points: Point[] | CompoundPath, concavity = 50): CompoundPath {
  const pointSet = (points instanceof CompoundPath ? pathToPoints(points) : points).map((point) => [point.x, point.y]);
  const hullShape = hull(pointSet, concavity) as number[][];
  const hullPath = new Path(hullShape.map((point) => new Point(point[0], point[1])));
  return new CompoundPath(hullPath);
}

export { pathToPoints, concaveHull };
