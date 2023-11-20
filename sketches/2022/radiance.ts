import { vector } from "@flatten-js/core"
import { run, SketchFactory } from "core/sketch"
import { converter, formatCss } from "culori"
import { Color, Container, Graphics, Sprite } from "pixi.js"

//TODO: Add comments
const oklab = converter("oklab")
const sketch: SketchFactory = ({ random, bbox }) => {
  const gradientCenter = vector(random.minmax(bbox.width * 0.4), random.minmax(bbox.height * 0.4))
  const gradientRotation = Math.atan2(gradientCenter.y, gradientCenter.x) + random.minmax(Math.PI / 8)
  const palette = [random.color(), random.color(), random.color()] // TODO: Generate palette
  const paletteCss = palette.map((color) => formatCss(oklab(new Color(color).toHex())) as string)

  const container = new Container()
  container.addChild(drawBackground(), drawRays(), drawCircle()) //TODO: Add noise texture

  return { container }

  function _update(_: number, totalTime: number) {
    container.getChildAt(1).rotation = ((totalTime % 10) / 10) * 2 * Math.PI
  }

  function drawBackground() {
    // TODO: Refactor gradient function
    // TODO: Antialias gradient border
    const canvas = new OffscreenCanvas(bbox.width, bbox.height)
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D
    const gradient = ctx.createConicGradient(
      gradientRotation + Math.PI,
      bbox.width / 2 + gradientCenter.x,
      bbox.height / 2 + gradientCenter.y
    )
    gradient.addColorStop(0, paletteCss[0])
    gradient.addColorStop(random.real(0.3, 0.7), paletteCss[1])
    gradient.addColorStop(1, paletteCss[1])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, bbox.width, bbox.height)

    const sprite = Sprite.from(canvas)
    sprite.anchor.set(0.5, 0.5)
    return sprite
  }

  function drawRays() {
    const triangleHeight = Math.hypot(bbox.width, bbox.height)
    const rotationStep = 0.25
    const triangleContainer = new Container().setTransform(gradientCenter.x, gradientCenter.y)
    const triangleTemplate = new Graphics()
      .beginFill("white")
      .drawPolygon([vector(0, 0), vector(-triangleHeight, 1), vector(-triangleHeight, -1)])

    let rotation = 0
    while (rotation < 2 * Math.PI - rotationStep / 2) {
      const rayRotation = rotation + gradientRotation
      const rayAngle = random.real(0.04, 0.08)
      const triangleHalfBase = triangleHeight * Math.tan(rayAngle / 2)

      const triangleGraphics = triangleContainer.addChild(
        new Graphics(triangleTemplate.geometry).setTransform(0, 0, 1, triangleHalfBase, rayRotation)
      )
      triangleGraphics.tint = new Array(3).fill(random.bool() ? random.realZeroTo(0.2) : 1 - random.realZeroTo(0.2))

      rotation += random.real(1, 1.2) * rotationStep
    }
    return triangleContainer
  }

  function drawCircle() {
    // TODO: Add linear gradient with rotation
    return new Graphics().beginFill(palette[0]).drawCircle(gradientCenter.x, gradientCenter.y, random.real(50, 75))
  }
}

run(sketch)
