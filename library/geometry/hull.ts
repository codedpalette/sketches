import hull from "hull.js";
import { CompoundPath, Path, Point } from "../paper";

function concaveHull(shape: Point[] | CompoundPath, concavity = 50): CompoundPath {
  const pointSet = (shape instanceof CompoundPath ? shape.toPoints() : shape).map((point) => [point.x, point.y]);
  const hullShape = hull(pointSet, concavity) as number[][];
  const hullPath = new Path(hullShape.map((point) => new Point(point[0], point[1])));
  return new CompoundPath(hullPath);
}

export { concaveHull };
