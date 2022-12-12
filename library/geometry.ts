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

function tryPlaceTile(
  tryPath: paper.CompoundPath,
  tryHull: paper.CompoundPath,
  dims: [number, number, number, number],
  paths: paper.CompoundPath[],
  blacklist?: paper.CompoundPath,
  nTries = 100
): void {
  const [minX, minY, maxX, maxY] = dims;
  while (true) {
    for (let i = 0; i < nTries; i++) {
      const [x, y] = [random(minX, maxX - tryPath.bounds.width), random(minY, maxY - tryPath.bounds.height)];
      tryPath.translate([x, y]);
      tryHull.translate([x, y]);

      const intersectsPath = paths.some((path) => tryPath.intersects(path));
      const intersects =
        intersectsPath || (blacklist ? (tryHull.intersect(blacklist) as paper.CompoundPath).length != 0 : false);
      if (!intersects) return;
      tryPath.translate([-x, -y]);
      tryHull.translate([-x, -y]);
    }
    tryPath.scale(0.9, [0, 0]);
    tryHull.scale(0.9, [0, 0]);
  }
}

function generateTiling(
  rectangle: Rectangle,
  pathFactory: (i?: number) => paper.CompoundPath,
  blacklistPath?: paper.CompoundPath,
  n = 500
): paper.CompoundPath[] {
  const t0 = performance.now();
  const paths: paper.CompoundPath[] = [];
  const c = random(1, 1.3); //TODO: lower the c - faster and sparser
  console.log(c);
  const rectArea = Math.abs(rectangle.width * rectangle.height);
  const totalArea = rectArea - (blacklistPath?.area || 0);
  const initialArea = totalArea / zeta(c);
  const [minX, minY, maxX, maxY] = [
    Math.min(rectangle.left, rectangle.right),
    Math.min(rectangle.top, rectangle.bottom),
    Math.max(rectangle.left, rectangle.right),
    Math.max(rectangle.top, rectangle.bottom),
  ];
  for (let i = 0; i < n; i++) {
    console.log(i);
    const desiredArea = i == 0 ? initialArea : initialArea * Math.pow(i, -c);
    const tryPath = pathFactory(i);
    const tryHull = concaveHull(pathToPoints(tryPath));
    tryHull.simplify();
    const scaleFactor = Math.sqrt(desiredArea / tryHull.area);
    tryPath.scale(scaleFactor, [0, 0]);
    tryHull.scale(scaleFactor, [0, 0]);
    tryPlaceTile(tryPath, tryHull, [minX, minY, maxX, maxY], paths, blacklistPath);
    paths.push(tryPath);
  }
  const t1 = performance.now();
  console.log(`tiling took ${(t1 - t0) / 1000}s`);
  return paths;
}

export { concaveHull, pathToPoints, generateTiling };
