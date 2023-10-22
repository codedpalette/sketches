import { line, point, Segment, segment, vector } from "@flatten-js/core"
import { run, SketchFactory } from "core/sketch"
import { formatHex } from "culori"
import { drawBackground } from "drawing/helpers"
import { renderLines } from "drawing/mesh"
import { ColorSource, Container, FXAAFilter, NoiseFilter, Sprite } from "pixi.js"
import { map } from "utils/helpers"
import { noise3d } from "utils/random"

const formatHsl = (hsl: [number, number, number]) => formatHex({ mode: "hsl", h: hsl[0], s: hsl[1], l: hsl[2] })
const sketch: SketchFactory = ({ random, bbox }) => {
  const noise = noise3d(random)
  const hue = random.real(0, 360)
  const bgColor = formatHsl([hue, random.real(0.2, 0.3), random.real(0.8, 0.9)])
  const numLayers = 1 //random.integer(2, 4)
  const startingRotation = random.realZeroTo(Math.PI * 2)

  const container = new Container()
  container.addChild(drawBackground(bgColor, bbox))
  for (let i = 1; i <= numLayers; i++) {
    container.addChild(drawLayer(i))
  }
  container.filters = [new NoiseFilter(random.real(0.1, 0.2), random.realZeroToOneInclusive()), new FXAAFilter()]
  return { container }

  function drawLayer(layerNum: number) {
    const container = new Container()
    const rotation = startingRotation + layerNum * ((Math.PI / numLayers) * random.real(0.8, 1.2))
    // TODO: calculate noiseFactor and lineSpacing

    // const mask = drawMask(layerNum)
    // container.mask = mask
    // container.addChild(mask)

    const lines = drawLines(rotation % Math.PI)
    container.addChild(lines)
    return container
  }

  function _drawMask(layerNum: number) {
    // TODO: NoiseAlphaFilter
    const noiseFactor = 0.001 //random.real(0.001, 0.01)
    const cutoff = random.real(0.25, 0.5)

    const canvas = new OffscreenCanvas(bbox.width, bbox.height)
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D
    const imageData = ctx.getImageData(0, 0, bbox.width, bbox.height)
    const pixels = imageData.data

    let i = 0
    for (let y = 0; y < bbox.height; y++) {
      for (let x = 0; x < bbox.width; x++) {
        const n = noise(x * noiseFactor, y * noiseFactor, layerNum * 1000)
        pixels[i++] = pixels[i++] = pixels[i++] = Math.abs(n) > cutoff ? 255 : 0
        pixels[i++] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)

    const sprite = Sprite.from(canvas)
    sprite.anchor.set(0.5, 0.5)
    return sprite
  }

  function drawLines(rotation: number) {
    const c = new Container()
    const lineSpacing = random.real(15, 25)
    const strokeDiv = lineSpacing / 5
    const lineNormal = vector(0, 1).rotate(rotation)
    const lineEq = line(point(0, 0), lineNormal)

    const sat = random.real(0.5, 1)
    const bri = random.real(0.1, 0.3)
    const lineColor = formatHsl([(hue + 180) % 360, sat, bri])

    // const templateGraphics = new Graphics().lineStyle(1, lineColor).lineTo(1, 0)
    // templateGraphics.finishPoly()
    // const template = renderGraphics(templateGraphics, renderer)

    const segments: Segment[] = []
    let factor = 0
    for (;;) {
      const translateVector = lineNormal.multiply(lineSpacing * factor)
      const lineEqOffset = lineEq.translate(translateVector)
      const [pt0, pt1] = lineEqOffset.intersect(bbox)
      if (pt1 == undefined) break

      const lineSegment = segment(pt0, pt1)
      segments.push(lineSegment)
      //c.addChild(...drawLine(lineSegment, lineColor, strokeDiv, template))

      if (factor == 0) factor = 1
      else if (factor > 0) factor = -factor
      else factor = -factor + 1
    }

    c.addChild(renderLines(segments, strokeDiv * 2, lineColor))
    return c
  }

  function _drawLine(segment: Segment, lineColor: ColorSource, strokeDiv: number, template: Sprite) {
    // TODO: Rewrite to shader
    const sprites: Sprite[] = []
    const step = random.real(0.01, 0.02) * segment.length
    const noiseScale = 0.005

    let chunkStart = segment.start
    for (let i = step; i < segment.length; i += step) {
      const n = noise(chunkStart.x * noiseScale, chunkStart.y * noiseScale, 0)
      const alpha = map(n, -1, 1, 0.6, 1)
      const offset = random.minmax(0.5) * Math.SQRT2 * strokeDiv // TODO: Fix offset
      const thickness = map(n, -1, 1, 2, 2 + strokeDiv)

      const chunkEnd = segment.pointAtLength(i + step)?.translate(vector(-offset, offset)) || segment.end
      const chunkVector = vector(chunkStart, chunkEnd)
      const chunkSprite = new Sprite(template.texture).setTransform(
        chunkStart.x,
        chunkStart.y,
        chunkVector.length,
        thickness,
        chunkVector.slope
      )
      chunkSprite.pivot = template.pivot
      chunkSprite.alpha = alpha
      sprites.push(chunkSprite)
      chunkStart = chunkEnd
    }
    return sprites
  }
}

run(sketch)
