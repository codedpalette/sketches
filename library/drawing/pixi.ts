import { SVGScene } from "@pixi-essentials/svg";
import { ColorSource, Container, Graphics } from "pixi.js";

export type LineLike = [number, number, number, number] | { x1: number; y1: number; x2: number; y2: number };

export function drawLines(lines: LineLike[], graphics: Graphics) {
  lines.forEach((line) => {
    const [x1, y1, x2, y2] = line instanceof Array ? line : [line.x1, line.y1, line.x2, line.y2];
    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
  });
}

export function drawAxes({ width, height }: { width: number; height: number }): Graphics {
  const graphics = new Graphics().lineStyle(1, 0xff0000);
  const lines: LineLike[] = [
    [-width / 2, 0, width / 2, 0],
    [0, height / 2, 0, -height / 2],
  ];
  drawLines(lines, graphics);
  return graphics;
}

export function drawPath(path: paper.Path | paper.CompoundPath): Graphics {
  const svgPath = path.exportSVG() as SVGElement;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1 1"); // Doesn't work without it
  svg.appendChild(svgPath);
  const scene = new SVGScene(svg);
  const graphics = scene.root.children[0] as Graphics;
  return graphics;
}

export function setBackground(container: Container, color: ColorSource, params: { width: number; height: number }) {
  const background = new Graphics()
    .beginFill(color)
    .drawRect(-params.width / 2, -params.height / 2, params.width, params.height);
  container.addChild(background);
}

export function gray(gray: number): ColorSource {
  return { r: gray, g: gray, b: gray };
}
