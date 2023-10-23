import { line, point, Segment, segment, vector } from "@flatten-js/core"
import { run, SketchFactory } from "core/sketch"
import { formatHex } from "culori"
import { drawBackground } from "drawing/helpers"
import { renderLines } from "drawing/mesh"
import { glslNoise, ShaderProgram } from "drawing/shaders"
import { Container, FXAAFilter, NoiseFilter, Sprite } from "pixi.js"
import { noise3d } from "utils/random"

const formatHsl = (hsl: [number, number, number]) => formatHex({ mode: "hsl", h: hsl[0], s: hsl[1], l: hsl[2] })
const sketch: SketchFactory = ({ random, bbox }) => {
  const noise = noise3d(random)
  const hue = random.real(0, 360)
  const bgColor = formatHsl([hue, random.real(0.2, 0.3), random.real(0.8, 0.9)])
  const numLayers = 1 //random.integer(2, 4)
  const startingRotation = random.realZeroTo(Math.PI * 2)
  const lineShader: ShaderProgram = {
    preamble: glslNoise,
    main: /*glsl*/ `
      vec2 noisePoint = vec2(vPosition.x, instanceId);
      float widthNoiseScale = 10.0;
      float offsetNoiseScale = 100.0;
      float alphaNoiseScale = 1000.0;
      float width = snoise(noisePoint * widthNoiseScale) * .25 + .5; // [0.25, 0.75]
      float offset = snoise(noisePoint * offsetNoiseScale) * .25; // [-0.25, 0.25]
      float alphaFactor = abs(snoise(noisePoint * alphaNoiseScale)) * .4 + .6; // [0.6, 1]
      float y = vPosition.y * 2.; // [-1, 1]
      float alpha = (1. - step(width, abs(y-offset))) * alphaFactor; 
      fragColor *= alpha;
    `,
  }

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
    const lineWidth = (lineSpacing * 2) / 5
    const lineNormal = vector(0, 1).rotate(rotation)
    const lineEq = line(point(0, 0), lineNormal)

    const sat = random.real(0.5, 1)
    const bri = random.real(0.1, 0.3)
    const lineColor = formatHsl([(hue + 180) % 360, sat, bri])

    const segments: Segment[] = []
    let factor = 0
    for (;;) {
      const translateVector = lineNormal.multiply(lineSpacing * factor)
      const lineEqOffset = lineEq.translate(translateVector)
      const [pt0, pt1] = lineEqOffset.intersect(bbox)
      if (pt1 == undefined) break

      const lineSegment = segment(pt0, pt1)
      segments.push(lineSegment)

      if (factor == 0) factor = 1
      else if (factor > 0) factor = -factor
      else factor = -factor + 1
    }

    c.addChild(renderLines(segments, lineWidth, lineColor, lineShader))
    return c
  }
}

run(sketch)
