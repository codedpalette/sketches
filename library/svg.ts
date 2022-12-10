import { Rectangle } from "pixi.js";
import * as paper from "paper";
import * as opentype from "opentype.js";

function pathDataToPath(pathData: string): paper.CompoundPath {
  const path = new paper.CompoundPath(pathData);
  path.scale(1, -1, [0, 0]);
  path.translate([-path.bounds.x, 0]);
  return path;
}

function glyphToPath(glyph: opentype.Glyph): paper.CompoundPath {
  return pathDataToPath(glyph.getPath().toPathData(2));
}

function textToPath(text: string, font: opentype.Font): paper.CompoundPath {
  return pathDataToPath(font.getPath(text, 0, 0, 72).toPathData(2));
}

function calculateGlyphBoundingBox(path: paper.CompoundPath) {
  const yFactor =
    path.data.yFactor !== undefined ? path.data.yFactor : (path.data.yFactor = path.bounds.y / path.bounds.height);
  const heightFactor =
    path.data.heightFactor || (path.data.heightFactor = (path.bounds.height + path.bounds.y) / path.bounds.height);
  const boundingBox = new Rectangle(
    path.bounds.x,
    path.bounds.y - path.bounds.height * yFactor,
    path.bounds.width,
    path.bounds.height * heightFactor
  );
  return boundingBox;
}

function pathToPoints(path: paper.CompoundPath): paper.Point[] {
  const points = [];
  const step = 3;
  for (let childPath of path.children as paper.Path[]) {
    const pathLength = childPath.length;
    for (let i = 0; i < pathLength; i += step) {
      points.push(childPath.getPointAt(i));
    }
  }
  return points;
}

export { glyphToPath, textToPath, calculateGlyphBoundingBox, pathToPoints };
