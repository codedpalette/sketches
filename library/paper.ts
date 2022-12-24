import * as paper from "paper";

function paperPathToPath(path: paper.Path): Path {
  return new Path(path.segments);
}

export type PathData = string; //TODO: Type branding

export class Point extends paper.Point {}
export class Path extends paper.Path {
  toPoints(step = 1): Point[] {
    const points = [];
    const pathLength = this.length;
    for (let i = 0; i < pathLength; i += step) {
      points.push(this.getPointAt(i));
    }
    return points;
  }
}
export class CompoundPath extends paper.CompoundPath {
  get childPaths(): Path[] {
    return this.children.map((child) => (child instanceof paper.Path ? paperPathToPath(child) : (child as Path)));
  }

  toPoints(step = 1): Point[] {
    return this.childPaths.flatMap((path) => path.toPoints(step));
  }
}
export class Color extends paper.Color {}
export class Rectangle extends paper.Rectangle {
  toPath(): CompoundPath {
    return new CompoundPath({ children: [new Path.Rectangle(this)] });
  }
}
export class Matrix extends paper.Matrix {}
