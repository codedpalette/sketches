import { CompoundPath, Point, Rectangle } from "../paper";
import { random } from "../util/random";
import { sync_timer } from "../util/timing";
import { concaveHull } from "./hull";

type RandomizationParams = {
  rotationBounds?: [number, number];
  skewBounds?: [Point, Point];
  shearBounds?: [Point, Point];
};

// Using class here to add execution time decorators
class Packing {
  private static zeta(z: number): number {
    const secondTerm = (z + 3) / (z - 1);
    const thirdTerm = 1 / Math.pow(2, z + 1);
    return 1 + secondTerm * thirdTerm;
  }

  private static tryPlaceTile(
    path: CompoundPath,
    dims: [number, number, number, number],
    paths: CompoundPath[],
    blacklist?: CompoundPath,
    randomizeParams?: RandomizationParams,
    nTries = 100
  ): CompoundPath {
    const [minX, minY, maxX, maxY] = dims;
    const pathsToCheck = blacklist ? [blacklist, ...paths] : paths;
    while (true) {
      let tryPath!: CompoundPath;
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

        const tryPathPoints = tryPath.toPoints(100); //TODO: just use one point from each child path
        const intersects = pathsToCheck.some(
          (path) => tryPath.intersects(path) || tryPathPoints.some((point) => path.contains(point))
        );
        if (!intersects) return tryPath;
      }
      console.log("scaling");
      tryPath.scale(0.9, [0, 0]);
    }
  }

  // http://paulbourke.net/fractals/randomtile/
  @sync_timer
  static generateTiling(
    rectangle: Rectangle,
    pathFactory: (i?: number) => CompoundPath,
    blacklistPath?: CompoundPath,
    randomizeParams?: RandomizationParams,
    n = 500
  ): CompoundPath[] {
    const paths = [];
    const c = random(1.1, 1.2);
    const rectArea = Math.abs(rectangle.width * rectangle.height);
    const totalArea = rectArea - (blacklistPath?.area || 0);
    const initialArea = totalArea / Packing.zeta(c);
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
      const tryHull = concaveHull(tryPath);
      const scaleFactor = Math.sqrt(desiredArea / tryHull.area);
      tryPath.scale(scaleFactor, [0, 0]);
      const newPath = Packing.tryPlaceTile(tryPath, [minX, minY, maxX, maxY], paths, blacklistPath, randomizeParams);
      paths.push(newPath);
    }
    return paths;
  }
}

function generateTiling(
  rectangle: Rectangle,
  pathFactory: (i?: number) => CompoundPath,
  blacklistPath?: CompoundPath,
  randomizeParams?: RandomizationParams,
  n = 500
): CompoundPath[] {
  return Packing.generateTiling(rectangle, pathFactory, blacklistPath, randomizeParams, n);
}

export { generateTiling };
