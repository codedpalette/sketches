import { CompoundPath, Matrix, Path, Point, Rectangle } from "geometry";
import hull from "hull.js";
import { Random } from "random-js";
import { asyncScheduler, map, Observable, observeOn, range } from "rxjs";
import { timed } from "util/timing";

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

export function concavePacking(
  shapesFactory: (i: number) => CompoundPath,
  packingParams: PackingParams,
  random: Random
): Observable<CompoundPath> {
  return new Packing(shapesFactory, packingParams, random).generateConcavePacking();
}

// Using class here to add execution time decorators
class Packing {
  private boundingRect: Rectangle;
  private nShapes: number;
  private blacklistShape?: CompoundPath;
  private randomizeParams?: RandomizationParams;
  constructor(
    private shapesFactory: (i: number) => CompoundPath,
    packingParams: PackingParams,
    private random: Random
  ) {
    ({
      boundingRect: this.boundingRect,
      nShapes: this.nShapes,
      blacklistShape: this.blacklistShape,
      randomizeParams: this.randomizeParams,
    } = packingParams);
  }

  // http://paulbourke.net/fractals/randomtile/
  @timed
  generateConcavePacking(): Observable<CompoundPath> {
    const paths: CompoundPath[] = [];
    const c = this.random.real(1, 1.5);
    const rectArea = Math.abs(this.boundingRect.width * this.boundingRect.height);
    const totalArea = rectArea - (this.blacklistShape?.area || 0);
    const initialArea = totalArea / this.zeta(c);

    return range(0, this.nShapes)
      .pipe(observeOn(asyncScheduler))
      .pipe(
        map((i) => {
          (i + 1) % 100 == 0 && console.log(`Packed ${i + 1} shapes out of ${this.nShapes}`);
          const desiredArea = i == 0 ? initialArea : initialArea * Math.pow(i, -c);
          const tryPath = this.shapesFactory(i).reorient(false, true) as CompoundPath;
          const tryArea = this.concaveHull(tryPath).area;
          const scaleFactor = Math.sqrt(desiredArea / tryArea);
          tryPath.scale(scaleFactor, [0, 0]);
          const newPath = this.tryPlaceTile(tryPath, paths);
          paths.push(newPath);
          return newPath;
        })
      );
  }

  private tryPlaceTile(tryPath: CompoundPath, existingPaths: CompoundPath[], nTries = 100): CompoundPath {
    const pathsToCheck = this.blacklistShape ? [this.blacklistShape, ...existingPaths] : existingPaths;
    for (;;) {
      for (let i = 0; i < nTries; i++) {
        const matrix = this.tryTransformMatrix(tryPath);
        tryPath.transform(matrix);
        if (!this.intersectsExistingPaths(tryPath, pathsToCheck)) return tryPath;
        tryPath.transform(matrix.invert());
      }
      tryPath.scale(0.9, [0, 0]);
    }
  }

  private intersectsExistingPaths(tryPath: CompoundPath, pathsToCheck: CompoundPath[]): boolean {
    const tryPathPoints = tryPath
      .childPaths()
      .flatMap((path) => [path.getPointAt(0), path.getPointAt(path.length / 2)]);
    const intersects = pathsToCheck.some(
      (path) => tryPathPoints.some((point) => path.contains(point)) || tryPath.intersects(path)
    );
    return intersects;
  }

  private tryTransformMatrix(tryPath: CompoundPath): Matrix {
    const matrix = new Matrix();
    const [boundingRect, randomizeParams] = [this.boundingRect, this.randomizeParams];
    const [minX, minY, maxX, maxY] = [boundingRect.left, boundingRect.bottom, boundingRect.right, boundingRect.top];
    const [x, y] = [
      this.random.integer(minX - tryPath.bounds.width, maxX),
      this.random.integer(minY - tryPath.bounds.height, maxY),
    ];

    matrix.translate([x, y]);
    if (randomizeParams) {
      const { rotationBounds, skewBounds, shearBounds } = randomizeParams;
      if (rotationBounds) {
        const rotation = this.random.integer(rotationBounds[0], rotationBounds[1]);
        matrix.rotate(rotation, tryPath.position);
      }
      if (skewBounds) {
        const skewHor = this.random.integer(...skewBounds.horizontal);
        const skewVer = this.random.integer(...skewBounds.vertical);
        matrix.skew(skewHor, skewVer);
      }
      if (shearBounds) {
        const shearHor = this.random.integer(...shearBounds.horizontal);
        const shearVer = this.random.integer(...shearBounds.vertical);
        matrix.shear(shearHor, shearVer);
      }
    }
    return matrix;
  }

  private concaveHull(shape: Point[] | CompoundPath, concavity = 50): CompoundPath {
    const pointSet = (shape instanceof CompoundPath ? shape.toPoints() : shape).map((point) => [point.x, point.y]);
    const hullShape = hull(pointSet, concavity) as number[][];
    const hullPath = new Path(hullShape.map((point) => new Point(point[0], point[1])));
    return new CompoundPath(hullPath);
  }

  private zeta(z: number): number {
    const secondTerm = (z + 3) / (z - 1);
    const thirdTerm = 1 / Math.pow(2, z + 1);
    return 1 + secondTerm * thirdTerm;
  }
}
