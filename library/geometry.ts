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

function pathToPoints(path: paper.CompoundPath, step = 3): paper.Point[] {
  const points = [];
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
  dims: [number, number, number, number],
  paths: paper.CompoundPath[],
  blacklist?: paper.CompoundPath,
  nTries = 100
): void {
  const [minX, minY, maxX, maxY] = dims;
  const pathsToCheck = blacklist ? [blacklist, ...paths] : paths;
  while (true) {
    for (let i = 0; i < nTries; i++) {
      const [x, y] = [random(minX - tryPath.bounds.width, maxX), random(minY - tryPath.bounds.height, maxY)];
      tryPath.translate([x, y]);
      //TODO: random rotation and skew

      const tryPathPoints = pathToPoints(tryPath, 100);
      const intersects = pathsToCheck.some(
        (path) => tryPath.intersects(path) || tryPathPoints.some((point) => path.contains(point))
      );

      if (!intersects) return;
      tryPath.translate([-x, -y]);
    }
    tryPath.scale(0.9, [0, 0]);
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
  const c = random(1.1, 1.2);
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
    const scaleFactor = Math.sqrt(desiredArea / tryHull.area);
    tryPath.scale(scaleFactor, [0, 0]);
    tryPlaceTile(tryPath, [minX, minY, maxX, maxY], paths, blacklistPath);
    paths.push(tryPath);
  }
  const t1 = performance.now();
  console.log(`tiling took ${(t1 - t0) / 1000}s`);
  return paths;
}

export { concaveHull, pathToPoints, generateTiling };
