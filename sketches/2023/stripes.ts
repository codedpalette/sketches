import { drawPath } from "drawing/pixi"
import { Params, run, SketchParams } from "drawing/sketch"
import { deg, fromPolar } from "geometry/angles"
import { Color, CompoundPath, Line, Path, Point, Rectangle } from "geometry/paths"
import { max, min, multiply, sign, sin, tan } from "mathjs"
import { Container } from "pixi.js"
import { random } from "utils/random"

//TODO: Rewrite to WebGL
// - Color palette, gradients, blurry polygons in the background
// - Calculate intercept offset to make corners always visible
// - Noise for darker blots on stripes
// - Suprematism (shapes on corners, spikes around)
// - Negative space
// - Shade on stripes
// - Shade on the floor

run((params) => {
  const container = new Container()
  const rect = generateRect(params).toPath()
  rect.fillColor = new Color("black")

  const { lines, segments } = generateStripes(params)
  const stripedRect = rect.intersect(segments) as CompoundPath
  container.addChild(drawPath(stripedRect))

  if (params.debug) {
    lines.strokeColor = new Color("blue")
    container.addChild(drawPath(lines))
  }
  return { container }
}, Params.DEBUG)

function generateRect(params: SketchParams): Rectangle {
  const halfDim = min(params.width, params.height) / 2
  const randomBounds = [0.5, 0.9] as const
  const corner = new Point(multiply(halfDim, [-random.real(...randomBounds), random.real(...randomBounds)]))
  return new Rectangle(corner, [-corner.x * 2, -corner.y * 2])
}

function generateStripes(params: SketchParams): { lines: CompoundPath; segments: CompoundPath } {
  const lines = [],
    segments = []
  const slopeDeg = random.real(20, 70)
  const slope = tan(deg(slopeDeg)) * random.sign()

  const lineDist = random.integer(100, 150)
  const interceptStep = lineDist / sin(deg(90 - slopeDeg))
  const halfLineWidth = lineDist * 0.5 * random.real(0.6, 0.8)
  const lineWidthOffset = fromPolar(halfLineWidth, deg(90 + slopeDeg * sign(slope)))

  const [fromX, toX] = multiply(params.width, [-2, 2])
  const interceptBounds = multiply([fromX, toX], -slope)
  for (let intercept = min(interceptBounds); intercept < max(interceptBounds); intercept += interceptStep) {
    const from = new Point(fromX, slope * fromX + intercept)
    const to = new Point(toX, slope * toX + intercept)
    lines.push(new Line(from, to))

    const segmentPoints = [
      from.add(lineWidthOffset),
      to.add(lineWidthOffset),
      to.subtract(lineWidthOffset),
      from.subtract(lineWidthOffset),
    ]
    segments.push(new Path({ segments: segmentPoints, closed: true }))
  }
  return { lines: new CompoundPath({ children: lines }), segments: new CompoundPath({ children: segments }) }
}
