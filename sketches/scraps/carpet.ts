import { setBackground } from "drawing/pixi"
import { run } from "drawing/sketch"
import { cos, pi, sin, sqrt } from "mathjs"
import { ColorSource, Container, Graphics } from "pixi.js"
import { map } from "utils/map"
import { noise2d, random } from "utils/random"

run((params) => {
  const noise = noise2d()
  const palette: ColorSource[] = ["#2E294E", "#541388", "#F1E9DA", "#FFD400", "#D90368"]
  random.shuffle(palette)
  const bgColor = palette.shift() as ColorSource
  const rOuter = random.real(100, 150)
  const innerLayerScale = random.real(0.5, (sqrt(2) as number) / 2)
  const innerRadiusFactor = random.real(0.3 * innerLayerScale, 0.7 * innerLayerScale)
  const container = new Container()
  container.rotation = random.real(0, pi / 4)
  container.position.set(random.real(0, rOuter), random.real(0, rOuter))
  setBackground(container, bgColor, { width: params.width * 2, height: params.height * 2 })

  let xOffset = 0,
    colorIndex = 0
  for (let y = -params.height * 2; y <= params.height * 2; y += rOuter) {
    for (let x = -params.width * 2; x <= params.width * 2; x += rOuter * 2) {
      const color = palette[colorIndex]
      container.addChild(drawStar(x + xOffset, y, rOuter, color))
      colorIndex = (colorIndex + 1) % palette.length
    }
    xOffset = xOffset == 0 ? rOuter : 0
  }

  return { container }

  function drawStarLayer(rOuter: number, rInner: number, color: ColorSource) {
    const g = new Graphics().lineStyle(1, "black")
    for (let i = 0; i < 4; i++) {
      const theta = (i * pi) / 2
      const centerVertex = { x: 0, y: 0 }
      const outerVertex = { x: rOuter * cos(theta), y: rOuter * sin(theta) }
      const innerVertex = (isColor: boolean) => {
        const rotation = isColor ? pi / 4 : -pi / 4
        return { x: rInner * cos(theta + rotation), y: rInner * sin(theta + rotation) }
      }
      g.beginFill(color)
        .drawPolygon([centerVertex, outerVertex, innerVertex(true)])
        .closePath()
        .beginFill("white")
        .drawPolygon([centerVertex, outerVertex, innerVertex(false)])
        .closePath()
    }
    return g
  }

  function drawStar(x: number, y: number, rOuter: number, color: ColorSource) {
    const n = noise(x, y)
    const rotation = pi / 4 + map(n, 0, 1, -pi / 16, pi / 16)
    const starContainer = new Container().setTransform(x, y)
    const outerLayer = drawStarLayer(rOuter, rOuter * innerRadiusFactor, color)
    const innerLayer = drawStarLayer(rOuter, rOuter * (innerRadiusFactor + 0.1), color)
    innerLayer.rotation = rotation
    innerLayer.scale.set(innerLayerScale)
    starContainer.addChild(innerLayer, outerLayer)
    return starContainer
  }
})
