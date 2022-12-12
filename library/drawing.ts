import paper from "paper";
import { Graphics } from "pixi.js";
import { SVGScene } from "@pixi-essentials/svg";

export type LineLike = [number, number, number, number] | { x1: number; y1: number; x2: number; y2: number };

function drawLines(lines: LineLike[], graphics: Graphics) {
  lines.forEach((line) => {
    const [x1, y1, x2, y2] = line instanceof Array ? line : [line.x1, line.y1, line.x2, line.y2];
    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
  });
}

function drawPath(path: paper.CompoundPath): Graphics {
  const pathCopy = path.clone();
  const svgPath = pathCopy.exportSVG() as SVGElement;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1 1"); // Doesn't work without it
  svg.appendChild(svgPath);
  const scene = new SVGScene(svg);
  const graphics = scene.root.children[0] as Graphics;
  return graphics;
}

export { drawLines, drawPath };
