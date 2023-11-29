import { box, vector } from "@flatten-js/core"
import { run, SketchFactory } from "core/sketch"
import { converter, formatCss } from "culori"
import { renderCanvas } from "drawing/helpers"
import { Color, Container, Graphics } from "pixi.js"

const oklab = converter("oklab")
const sketch: SketchFactory = ({ random, bbox }) => {
  const gradientCenter = vector(random.minmax(bbox.width * 0.4), random.minmax(bbox.height * 0.4))
  const gradientRotation = Math.atan2(gradientCenter.y, gradientCenter.x) + random.minmax(Math.PI / 8)
  const palette = [random.color(), random.color(), random.color()]
  const paletteCss = palette.map((color) => formatCss(oklab(new Color(color).toHex())) as string)

  const container = new Container()
  container.addChild(drawBackground(), drawRays(), drawCircle())

  return { container }

  function drawBackground() {
    return renderCanvas((ctx) => {
      const gradient = ctx.createConicGradient(
        -gradientRotation + Math.PI,
        bbox.width / 2 + gradientCenter.x,
        bbox.height / 2 - gradientCenter.y
      )
      gradient.addColorStop(0, paletteCss[0])
      gradient.addColorStop(random.real(0.3, 0.7), paletteCss[1])
      gradient.addColorStop(1, paletteCss[1])
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, bbox.width, bbox.height)
    }, bbox)
  }

  function drawRays() {
    const triangleHeight = Math.hypot(bbox.width, bbox.height)
    const rotationStep = 0.25
    const triangleContainer = new Container().setTransform(gradientCenter.x, gradientCenter.y)
    const triangleTemplate = new Graphics()
      .beginFill("white")
      .drawPolygon([vector(0, 0), vector(-triangleHeight, 1), vector(-triangleHeight, -1)])

    let rotation = 0
    while (rotation < 2 * Math.PI - rotationStep) {
      const rayRotation = rotation + gradientRotation
      const rayAngle = random.real(0.04, 0.08)
      const triangleHalfBase = triangleHeight * Math.tan(rayAngle / 2)

      const triangleGraphics = triangleContainer
        .addChild(new Graphics(triangleTemplate.geometry))
        .setTransform(0, 0, 1, triangleHalfBase, rayRotation)
      triangleGraphics.tint = new Array(3).fill(random.bool() ? random.realZeroTo(0.2) : 1 - random.realZeroTo(0.2))

      rotation += random.real(1, 1.2) * rotationStep
    }
    return triangleContainer
  }

  function drawCircle() {
    const radius = random.real(50, 75)
    const circleBbox = box(0, 0, radius * 2, radius * 2)
    return renderCanvas((ctx) => {
      const gradient = ctx.createLinearGradient(radius, 0, radius, radius * 2)
      gradient.addColorStop(0, paletteCss[0])
      gradient.addColorStop(1, paletteCss[1])
      ctx.fillStyle = gradient

      ctx.beginPath()
      ctx.ellipse(radius, radius, radius, radius, 0, 0, 2 * Math.PI)
      ctx.fill()
    }, circleBbox).setTransform(gradientCenter.x, gradientCenter.y)
  }
}

run(sketch)
