import paper from "paper/dist/paper-core";
paper.setup([1, 1]);

export type PointLike = paper.PointLike;
export type SizeLike = paper.SizeLike;

export type Point = paper.Point;
export const Point = paper.Point;
export type Rectangle = paper.Rectangle;
export const Rectangle = paper.Rectangle;

export type Path = paper.Path;
export const Path = paper.Path;
export type CompoundPath = paper.CompoundPath;
export const CompoundPath = paper.CompoundPath;

export type Color = paper.Color;
export const Color = paper.Color;
export type Matrix = paper.Matrix;
export const Matrix = paper.Matrix;

export type Line = paper.Path.Line;
export const Line = paper.Path.Line;
export type Circle = paper.Path.Circle;
export const Circle = paper.Path.Circle;
export type Ellipse = paper.Path.Ellipse;
export const Ellipse = paper.Path.Ellipse;

Point.prototype.toVec = function () {
  return [this.x, this.y];
};

Path.prototype.toPoints = function (step = 1) {
  const points = [];
  const pathLength = this.length;
  for (let i = 0; i < pathLength; i += step) {
    points.push(this.getPointAt(i));
  }
  return points;
};

CompoundPath.prototype.childPaths = function () {
  return this.children as Path[];
};
CompoundPath.prototype.toPoints = function (step = 1) {
  return this.childPaths().flatMap((path) => path.toPoints(step));
};

Rectangle.prototype.toPath = function () {
  return new Path.Rectangle(this);
};
