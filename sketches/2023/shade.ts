import { line, Point, point, Segment, segment, vector } from "@flatten-js/core"
import { run, SketchFactory } from "core/sketch"
import { formatHex } from "culori"
import { drawBackground } from "drawing/helpers"
import { ColorSource, Container, Graphics, NoiseFilter } from "pixi.js"
import { map } from "utils/helpers"
import { noise2d } from "utils/random"

const formatHsl = (hsl: [number, number, number]) => formatHex({ mode: "hsl", h: hsl[0], s: hsl[1], l: hsl[2] })
const sketch: SketchFactory = ({ random, bbox }) => {
  const noise = noise2d(random)
  const hue = random.real(0, 360)
  const bgColor = formatHsl([hue, random.real(0.2, 0.3), random.real(0.8, 0.9)])

  const container = new Container()
  container.addChild(drawBackground(bgColor, bbox))
  container.addChild(drawLines(random.realZeroTo(Math.PI / 2)))
  container.filters = [new NoiseFilter(random.real(0.1, 0.2), random.realZeroToOneInclusive())]
  return { container }

  function drawLines(rotation: number) {
    const c = new Container()
    const lineSpacing = random.real(15, 25)
    const strokeDiv = lineSpacing / 5

    const sat = random.real(0.5, 1)
    const bri = random.real(0.1, 0.3)
    const lineColor = formatHsl([(hue + 180) % 360, sat, bri])

    const lineNormal = vector(0, 1).rotate(rotation)
    const lineEq = line(point(0, 0), lineNormal)
    let factor = 0

    for (;;) {
      const translateVector = lineNormal.multiply(lineSpacing * factor)
      const lineEqOffset = lineEq.translate(translateVector)
      const [pt0, pt1] = lineEqOffset.intersect(bbox)
      if (pt1 == undefined) break

      const lineSegment = segment(pt0, pt1)
      c.addChild(drawLine(lineSegment, lineColor, strokeDiv))

      if (factor == 0) factor = 1
      else if (factor > 0) factor = -factor
      else factor = -factor + 1
    }
    return c
  }

  function drawLine(segment: Segment, lineColor: ColorSource, strokeDiv: number) {
    const c = new Container()
    const step = random.real(0.005, 0.01) * segment.length

    let pt = segment.start
    for (let i = step; i < segment.length; i += step) {
      const n = noise(pt.x / 100, pt.y / 100)
      const alpha = map(n, -1, 1, 0.6, 1)
      const offset = random.minmax(0.5) * Math.SQRT2
      const thickness = map(n, -1, 1, 2, 2 + strokeDiv)

      const g = c.addChild(new Graphics()).lineStyle(thickness, lineColor, alpha).moveTo(pt.x, pt.y)
      pt = segment.pointAtLength(Math.min(i + step, segment.length))?.translate(vector(-offset, offset)) as Point
      g.lineTo(pt.x, pt.y)
    }
    return c
  }
}

run(sketch)
