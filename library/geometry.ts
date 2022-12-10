import hull from "hull.js";
import { IPointData, Polygon } from "pixi.js";

function concaveHull(points: paper.Point[], concavity = 50): Polygon {
  const pointArrays = [];
  for (let point of points) {
    pointArrays.push([point.x, point.y]);
  }
  const shape = hull(pointArrays, concavity) as number[][];
  return new Polygon(shape.map((point) => ({ x: point[0], y: point[1] })));
}

export { concaveHull };
