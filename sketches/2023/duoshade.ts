import { hsl } from "color-convert"
import { run } from "drawing/sketch"
import { deg } from "geometry/angles"
import { Line, Point, Rectangle } from "geometry/paths"
import { abs, max, min, sqrt, tan } from "mathjs"
import { Container, Graphics, NoiseFilter, Sprite } from "pixi.js"
import { noise3d, random } from "utils/random"

run((params) => {
  const noise = noise3d()
  const hue = random.real(0, 360)
  const bgColor = hsl.hex([hue, random.real(20, 30), random.real(80, 90)])
  const numLayers = random.integer(2, 4)
  const startingRotation = random.real(0, 360)

  const bounds = new Rectangle(-params.width / 2, params.height / 2, params.width, -params.height).toPath()
  const container = new Container()

  const background = new Graphics()
    .beginFill(parseInt(bgColor, 16))
    .drawRect(-params.width / 2, -params.height / 2, params.width, params.height)
  background.filters = [new NoiseFilter(random.real(0.1, 0.2))]
  container.addChild(background)

  for (let i = 0; i < numLayers; i++) {
    container.addChild(drawLayer(i))
  }

  container.cacheAsBitmap = true
  return { container }

  function drawLayer(layerNum: number) {
    const container = new Container()
    const rotation = startingRotation + layerNum * ((180 / numLayers) * random.real(0.8, 1.2))

    const mask = drawMask(layerNum)
    container.mask = mask
    container.addChild(mask)

    const lines = drawLines(rotation % 180)
    container.addChild(lines)
    return container
  }

  function drawMask(layerNum: number) {
    const noiseFactor = random.real(0.001, 0.01)
    const cutoff = random.real(0.25, 0.5)

    const canvas = new OffscreenCanvas(params.width, params.height)
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D
    const imageData = ctx.getImageData(0, 0, params.width, params.height)
    const pixels = imageData.data

    let i = 0
    for (let y = 0; y < params.height; y++) {
      for (let x = 0; x < params.width; x++) {
        const n = noise(x * noiseFactor, y * noiseFactor, layerNum * 1000)
        pixels[i++] = pixels[i++] = pixels[i++] = n > cutoff ? 255 : 0
        pixels[i++] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)

    const sprite = Sprite.from(canvas)
    sprite.anchor.set(0.5, 0.5)
    return sprite
  }

  function drawLines(rotation: number) {
    const lineDist = random.real(5, 15)
    const strokeDiv = lineDist / 5

    const sat = random.real(50, 100)
    const bri = random.real(10, 30)
    const lineColor = hsl.hex([(hue + 180) % 360, sat, bri])

    const k = tan(deg(rotation))
    const lineBound = max(params.width, params.height)
    const line =
      rotation == 90
        ? new Line([0, -lineBound], [0, lineBound])
        : new Line([-lineBound, -lineBound * k], [lineBound, lineBound * k])
    const maxIntercept = rotation == 90 ? params.width / 2 : params.height / 2 + (params.width / 2) * abs(k)
    const lineStep = rotation == 90 ? lineDist : lineDist * (sqrt(1 + k * k) as number)

    const c = new Container()
    drawLine(line, lineColor, strokeDiv, c)
    for (let i = lineStep; i < maxIntercept; i += lineStep) {
      line.position = rotation == 90 ? new Point(i, 0) : new Point(0, i)
      drawLine(line, lineColor, strokeDiv, c)
      line.position = rotation == 90 ? new Point(-i, 0) : new Point(0, -i)
      drawLine(line, lineColor, strokeDiv, c)
    }
    return c
  }

  function drawLine(line: Line, lineColor: string, strokeDiv: number, c: Container) {
    const g = new Graphics()
    const step = random.real(0.001, 0.003) * line.length
    const intersections = line.getIntersections(bounds).map((p) => p.offset)
    if (intersections.length == 0) return

    const [start, end] = [min(intersections), max(intersections)]
    const startPoint = line.getPointAt(start)
    g.moveTo(startPoint.x, startPoint.y)
    for (let i = start; i < end + step; i += step) {
      const alpha = random.real(0.6, 1)
      const point = line.getPointAt(i)
      const offset = random.real(-0.5, 0.5) * (sqrt(2) as number)
      g.lineStyle(random.real(2, 2 + strokeDiv), lineColor, alpha).lineTo(point.x - offset, point.y + offset)
    }
    c.addChild(g)
  }
})
