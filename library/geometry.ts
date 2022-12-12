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

type RandomizationParams = {
  rotationBounds?: [number, number];
  skewBounds?: [paper.Point, paper.Point];
  shearBounds?: [paper.Point, paper.Point];
};

function tryPlaceTile(
  path: paper.CompoundPath,
  dims: [number, number, number, number],
  paths: paper.CompoundPath[],
  blacklist?: paper.CompoundPath,
  randomizeParams?: RandomizationParams,
  nTries = 100
): paper.CompoundPath {
  const [minX, minY, maxX, maxY] = dims;
  const pathsToCheck = blacklist ? [blacklist, ...paths] : paths;
  while (true) {
    let tryPath!: paper.CompoundPath;
    for (let i = 0; i < nTries; i++) {
      tryPath = path.clone();

      const [x, y] = [random(minX - tryPath.bounds.width, maxX), random(minY - tryPath.bounds.height, maxY)];
      tryPath.translate([x, y]);
      if (randomizeParams) {
        randomizeParams.rotationBounds &&
          tryPath.rotate(random(randomizeParams.rotationBounds[0], randomizeParams.rotationBounds[1]));
        randomizeParams.skewBounds &&
          tryPath.skew([
            random(randomizeParams.skewBounds[0].x, randomizeParams.skewBounds[1].x),
            random(randomizeParams.skewBounds[0].y, randomizeParams.skewBounds[1].y),
          ]);
        randomizeParams.shearBounds &&
          tryPath.shear([
            random(randomizeParams.shearBounds[0].x, randomizeParams.shearBounds[1].x),
            random(randomizeParams.shearBounds[0].y, randomizeParams.shearBounds[1].y),
          ]);
      }

      const tryPathPoints = pathToPoints(tryPath, 100);
      const intersects = pathsToCheck.some(
        (path) => tryPath.intersects(path) || tryPathPoints.some((point) => path.contains(point))
      );
      if (!intersects) return tryPath;
    }
    tryPath.scale(0.9, [0, 0]);
  }
}

function generateTiling(
  rectangle: Rectangle,
  pathFactory: (i?: number) => paper.CompoundPath,
  blacklistPath?: paper.CompoundPath,
  randomizeParams?: RandomizationParams,
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
    const newPath = tryPlaceTile(tryPath, [minX, minY, maxX, maxY], paths, blacklistPath, randomizeParams);
    paths.push(newPath);
  }
  const t1 = performance.now();
  console.log(`tiling took ${(t1 - t0) / 1000}s`);
  return paths;
}

export { concaveHull, pathToPoints, generateTiling };
