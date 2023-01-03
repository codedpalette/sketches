import paper from "paper/dist/paper-core";

export function paperSetup(size: paper.SizeLike) {
  paper.setup(size);
}

export type Point = paper.Point;
export const Point = paper.Point;
paper.Point.prototype.toVec = function () {
  return [this.x, this.y];
};

export type Path = paper.Path;
export const Path = paper.Path;
paper.Path.prototype.toPoints = function (step = 1) {
  const points = [];
  const pathLength = this.length;
  for (let i = 0; i < pathLength; i += step) {
    points.push(this.getPointAt(i));
  }
  return points;
};

export type CompoundPath = paper.CompoundPath;
export const CompoundPath = paper.CompoundPath;
paper.CompoundPath.prototype.childPaths = function () {
  return this.children as Path[];
};
paper.CompoundPath.prototype.toPoints = function (step = 1) {
  return this.childPaths().flatMap((path) => path.toPoints(step));
};

export type Rectangle = paper.Rectangle;
export const Rectangle = paper.Rectangle;
paper.Rectangle.prototype.toPath = function () {
  return new Path.Rectangle(this);
};

export type Color = paper.Color;
export const Color = paper.Color;
export type Line = paper.Path.Line;
export const Line = paper.Path.Line;
export type Ellipse = paper.Path.Ellipse;
export const Ellipse = paper.Path.Ellipse;
export type Matrix = paper.Matrix;
export const Matrix = paper.Matrix;
