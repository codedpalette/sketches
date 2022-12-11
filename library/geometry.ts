import hull from "hull.js";
import paper from "paper";
import { Rectangle } from "pixi.js";
import { random } from "./util";

function concaveHull(points: paper.Point[], concavity = 50): paper.CompoundPath {
  const pointArrays = [];
  for (const point of points) {
    pointArrays.push([point.x, point.y]);
  }
  const shape = hull(pointArrays, concavity) as number[][];

  const hullPath = new paper.Path();
  shape.forEach((point) => hullPath.add(new paper.Point(point[0], point[1])));
  const hullCompoundPath = new paper.CompoundPath(hullPath);
  return hullCompoundPath;
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

function zeta(z: number): number {
  const secondTerm = (z + 3) / (z - 1);
  const thirdTerm = 1 / Math.pow(2, z + 1);
  return 1 + secondTerm * thirdTerm;
}

function generateTiling(
  rectangle: Rectangle,
  pathFactory: (i?: number) => paper.CompoundPath,
  _blacklistPath?: paper.CompoundPath
): paper.CompoundPath[] {
  const paths: paper.CompoundPath[] = [];
  const c = random(1, 1.3);
  const rectArea = Math.abs(rectangle.width * rectangle.height);
  const initialArea = rectArea / zeta(c);
  const n = 500;
  const [minX, minY, maxX, maxY] = [
    Math.min(rectangle.left, rectangle.right),
    Math.min(rectangle.top, rectangle.bottom),
    Math.max(rectangle.left, rectangle.right),
    Math.max(rectangle.top, rectangle.bottom),
  ];
  for (let i = 0; i < n; i++) {
    const desiredArea = i == 0 ? initialArea : initialArea * Math.pow(i, -c);
    const newPath = pathFactory(i);
    const hullPath = concaveHull(pathToPoints(newPath));
    const hullPathArea = hullPath.area;
    const scaleFactor = Math.sqrt(desiredArea / hullPathArea);
    newPath.scale(scaleFactor, [0, 0]);
    hullPath.scale(scaleFactor, [0, 0]);
    while (true) {
      const [x, y] = [random(minX, maxX), random(minY, maxY)];
      hullPath.translate([x, y]);
      //TODO: try toroidal bounds
      if (/*hullPath.isInside(rectangle) &&*/ !paths.some((path) => path.intersects(hullPath))) {
        newPath.translate([x, y]);
        break;
      }
      hullPath.translate([-x, -y]);
    }
    paths.push(newPath);
  }

  return paths;
}

export { concaveHull, pathToPoints, generateTiling };
