import { point, Segment, segment, vector } from "@flatten-js/core"
import { run, SketchFactory } from "core/sketch"
import { formatHex } from "culori"
import { drawBackground } from "drawing/helpers"
import { ColorSource, Container, Graphics, NoiseFilter } from "pixi.js"

const formatHsl = (hsl: [number, number, number]) => formatHex({ mode: "hsl", h: hsl[0], s: hsl[1], l: hsl[2] })
const sketch: SketchFactory = ({ random, params }) => {
  const hue = random.real(0, 360)
  const bgColor = formatHsl([hue, random.real(0.2, 0.3), random.real(0.8, 0.9)])

  const container = new Container()
  container.addChild(drawBackground(bgColor, params))
  container.addChild(drawLines(random.realZeroTo(Math.PI / 2)))
  container.filters = [new NoiseFilter(random.real(0.1, 0.2), random.realZeroToOneInclusive())]
  return { container }

  function drawLines(rotation: number) {
    const lineSpacing = random.real(5, 15)
    const strokeDiv = lineSpacing / 3

    const sat = random.real(0.5, 1)
    const bri = random.real(0.1, 0.3)
    const lineColor = formatHsl([(hue + 180) % 360, sat, bri])

    // TODO: Create one line instance; generate segments by intersecting with a box
    const k = Math.tan(rotation)
    const lineBound = Math.max(params.width, params.height)
    const is90deg = rotation == Math.PI / 2
    const lineSegment = is90deg
      ? segment(point([0, -lineBound]), point([0, lineBound]))
      : segment(point([-lineBound, -lineBound * k]), point([lineBound, lineBound * k]))
    const maxIntercept = is90deg ? params.width / 2 : params.height / 2 + (params.width / 2) * Math.abs(k)
    const lineStep = is90deg ? lineSpacing : lineSpacing * Math.sqrt(1 + k * k)

    const c = new Container()
    c.addChild(drawLine(lineSegment, lineColor, strokeDiv))
    for (let i = lineStep; i < maxIntercept; i += lineStep) {
      const translateVector = is90deg ? vector(i, 0) : vector(0, i)
      c.addChild(drawLine(lineSegment.translate(translateVector), lineColor, strokeDiv))
      c.addChild(drawLine(lineSegment.translate(translateVector.invert()), lineColor, strokeDiv))
    }
    return c
  }

  function drawLine(segment: Segment, lineColor: ColorSource, strokeDiv: number) {
    // TODO: Mesh and shader
    const g = new Graphics()
      .lineStyle(strokeDiv, lineColor)
      .moveTo(segment.start.x, segment.start.y)
      .lineTo(segment.end.x, segment.end.y)
    return g
  }
}

run(sketch)
