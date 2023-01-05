declare namespace paper {
  interface Point {
    toVec(): [number, number];
  }

  interface Path {
    toPoints(step = 1): Point[];
  }

  interface CompoundPath {
    childPaths(): Path[];
    toPoints(step = 1): Point[];
  }

  interface Rectangle {
    toPath(): Path;
  }
}

declare module "paper" {
  const paperCore: Pick<paper.PaperScope, Exclude<keyof paper.PaperScope, "PaperScript">>;
  export default paperCore;

  export type PointLike = paper.PointLike;
  export type SizeLike = paper.SizeLike;

  export type Point = paper.Point;
  export const Point = paperCore.Point;
  export type Rectangle = paper.Rectangle;
  export const Rectangle = paperCore.Rectangle;

  export type Path = paper.Path;
  export const Path = paperCore.Path;
  export type CompoundPath = paper.CompoundPath;
  export const CompoundPath = paperCore.CompoundPath;

  export type Color = paper.Color;
  export const Color = paperCore.Color;
  export type Matrix = paper.Matrix;
  export const Matrix = paperCore.Matrix;
}
