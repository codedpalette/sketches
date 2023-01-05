import paper, { CompoundPath, Path, Point, Rectangle, SizeLike } from "paper";

export function paperSetup(size: SizeLike) {
  return paper.setup(size);
}

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
