import { SVGScene } from "@pixi-essentials/svg"
import { Line, Path } from "geometry/paths"
import { ColorSource, Container, Graphics, ILineStyleOptions, Sprite } from "pixi.js"

export type LineLike = [number, number, number, number] | { x1: number; y1: number; x2: number; y2: number } | Line

export function drawLines(lines: LineLike[], graphics: Graphics) {
  lines.forEach((line) => {
    const [x1, y1, x2, y2] =
      line instanceof Array
        ? line
        : line instanceof Path
        ? [line.getPointAt(0).x, line.getPointAt(0).y, line.getPointAt(line.length).x, line.getPointAt(line.length).y]
        : [line.x1, line.y1, line.x2, line.y2]
    graphics.moveTo(x1, y1)
    graphics.lineTo(x2, y2)
  })
}

export function drawAxes({ width, height }: { width: number; height: number }, options?: ILineStyleOptions): Graphics {
  const lineStyleOptions = options || { width: 1, color: 0xff0000 }
  const graphics = new Graphics().lineStyle(lineStyleOptions)
  const lines: LineLike[] = [
    [-width / 2, 0, width / 2, 0],
    [0, height / 2, 0, -height / 2],
  ]
  drawLines(lines, graphics)
  return graphics
}

export function drawPath(path: paper.Path | paper.CompoundPath): Graphics {
  const svgPath = path.exportSVG() as SVGElement
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("viewBox", "0 0 1 1") // Doesn't work without it
  svg.appendChild(svgPath)
  const scene = new SVGScene(svg)
  const graphics = scene.root.children[0] as Graphics
  return graphics
}

export function setBackground(container: Container, color: ColorSource, params: { width: number; height: number }) {
  const background = new Graphics()
    .beginFill(color)
    .drawRect(-params.width / 2, -params.height / 2, params.width, params.height)
  container.addChild(background)
}

export function gray(gray: number): ColorSource {
  return { r: gray, g: gray, b: gray }
}

export function renderCanvas(
  render: (ctx: OffscreenCanvasRenderingContext2D) => void,
  params: { width: number; height: number }
): Sprite {
  const canvas = new OffscreenCanvas(params.width, params.height)
  const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D
  render(ctx)

  const sprite = Sprite.from(canvas)
  sprite.scale.set(1, -1)
  sprite.anchor.set(0.5, 0.5)
  return sprite
}
