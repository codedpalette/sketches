import { CompoundPath, Matrix, Path, Point, Rectangle } from "geometry/paths";
import hull from "hull.js";
import { asyncScheduler, finalize, map, Observable, observeOn, range } from "rxjs";
import { random } from "util/random";

export type Bounds2D = {
  horizontal: [number, number];
  vertical: [number, number];
};

export type RandomizationParams = {
  rotationBounds?: [number, number];
  skewBounds?: Bounds2D;
  shearBounds?: Bounds2D;
};

export type PackingParams = {
  boundingRect: Rectangle;
  nShapes: number;
  blacklistShape?: CompoundPath;
  //whitelistShape?: CompoundPath; - need to implement
  randomizeParams?: RandomizationParams;
};

// http://paulbourke.net/fractals/randomtile/
export function concavePacking(
  shapesFactory: (i: number) => CompoundPath,
  params: PackingParams
): Observable<CompoundPath> {
  const paths: CompoundPath[] = [];
  const c = random.real(1, 1.5);
  const rectArea = Math.abs(params.boundingRect.width * params.boundingRect.height);
  const totalArea = rectArea - (params.blacklistShape?.area || 0);
  const initialArea = totalArea / zeta(c);

  const t0 = performance.now();
  console.log("[timer] [generateConcavePacking]: begin");
  return range(0, params.nShapes)
    .pipe(observeOn(asyncScheduler))
    .pipe(
      map((i) => {
        (i + 1) % 100 == 0 && console.log(`Packed ${i + 1} shapes out of ${params.nShapes}`);
        const desiredArea = i == 0 ? initialArea : initialArea * Math.pow(i, -c);
        const tryPath = shapesFactory(i).reorient(false, true) as CompoundPath;
        const tryArea = concaveHull(tryPath).area;
        const scaleFactor = Math.sqrt(desiredArea / tryArea);
        tryPath.scale(scaleFactor, [0, 0]);
        const newPath = tryPlaceTile(tryPath, paths, params);
        paths.push(newPath);
        return newPath;
      })
    )
    .pipe(
      finalize(() =>
        console.log(`[timer] [generateConcavePacking]: timer ${((performance.now() - t0) * 0.001).toFixed(3)}s`)
      )
    );
}

function tryPlaceTile(
  tryPath: CompoundPath,
  existingPaths: CompoundPath[],
  params: PackingParams,
  nTries = 100
): CompoundPath {
  const pathsToCheck = params.blacklistShape ? [params.blacklistShape, ...existingPaths] : existingPaths;
  for (;;) {
    for (let i = 0; i < nTries; i++) {
      const matrix = tryTransformMatrix(tryPath, params.boundingRect, params.randomizeParams);
      tryPath.transform(matrix);
      if (!intersectsExistingPaths(tryPath, pathsToCheck)) return tryPath;
      tryPath.transform(matrix.invert());
    }
    tryPath.scale(0.9, [0, 0]);
  }
}

function intersectsExistingPaths(tryPath: CompoundPath, pathsToCheck: CompoundPath[]): boolean {
  const tryPathPoints = tryPath.childPaths().flatMap((path) => [path.getPointAt(0), path.getPointAt(path.length / 2)]);
  const intersects = pathsToCheck.some(
    (path) => tryPathPoints.some((point) => path.contains(point)) || tryPath.intersects(path)
  );
  return intersects;
}

function tryTransformMatrix(
  tryPath: CompoundPath,
  boundingRect: Rectangle,
  randomizeParams?: RandomizationParams
): Matrix {
  const matrix = new Matrix();
  const [minX, minY, maxX, maxY] = [boundingRect.left, boundingRect.bottom, boundingRect.right, boundingRect.top];
  const [x, y] = [
    random.integer(minX - tryPath.bounds.width, maxX),
    random.integer(minY - tryPath.bounds.height, maxY),
  ];

  matrix.translate([x, y]);
  if (randomizeParams) {
    const { rotationBounds, skewBounds, shearBounds } = randomizeParams;
    if (rotationBounds) {
      const rotation = random.integer(rotationBounds[0], rotationBounds[1]);
      matrix.rotate(rotation, tryPath.position);
    }
    if (skewBounds) {
      const skewHor = random.integer(...skewBounds.horizontal);
      const skewVer = random.integer(...skewBounds.vertical);
      matrix.skew(skewHor, skewVer);
    }
    if (shearBounds) {
      const shearHor = random.integer(...shearBounds.horizontal);
      const shearVer = random.integer(...shearBounds.vertical);
      matrix.shear(shearHor, shearVer);
    }
  }
  return matrix;
}

function concaveHull(shape: Point[] | CompoundPath, concavity = 50): CompoundPath {
  const pointSet = (shape instanceof CompoundPath ? shape.toPoints() : shape).map((point) => [point.x, point.y]);
  const hullShape = hull(pointSet, concavity) as number[][];
  const hullPath = new Path(hullShape.map((point) => new Point(point[0], point[1])));
  return new CompoundPath(hullPath);
}

function zeta(z: number): number {
  const secondTerm = (z + 3) / (z - 1);
  const thirdTerm = 1 / Math.pow(2, z + 1);
  return 1 + secondTerm * thirdTerm;
}
