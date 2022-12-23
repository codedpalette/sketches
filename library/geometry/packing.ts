import { Rectangle } from "pixi.js";
import { random } from "../util";
import { concaveHull, pathToPoints } from "./hull";

type RandomizationParams = {
  rotationBounds?: [number, number];
  skewBounds?: [paper.Point, paper.Point];
  shearBounds?: [paper.Point, paper.Point];
};

function zeta(z: number): number {
  const secondTerm = (z + 3) / (z - 1);
  const thirdTerm = 1 / Math.pow(2, z + 1);
  return 1 + secondTerm * thirdTerm;
}

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

      const tryPathPoints = pathToPoints(tryPath, 100); //TODO: just use one point from each child path
      const intersects = pathsToCheck.some(
        (path) => tryPath.intersects(path) || tryPathPoints.some((point) => path.contains(point))
      );
      if (!intersects) return tryPath;
    }
    console.log("scaling");
    tryPath.scale(0.9, [0, 0]);
  }
}

function* generateTiling(
  rectangle: Rectangle,
  pathFactory: (i?: number) => paper.CompoundPath,
  blacklistPath?: paper.CompoundPath,
  randomizeParams?: RandomizationParams,
  n = 500
): Generator<paper.CompoundPath> {
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
    yield newPath;
  }
  const t1 = performance.now();
  console.log(`tiling took ${(t1 - t0) / 1000}s`);
}

export { generateTiling };
