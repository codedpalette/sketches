import { drawPath, gray, setBackground } from "drawing/pixi"
import { run } from "drawing/sketch"
import { fromPolar } from "geometry/angles"
import { Color, plot } from "geometry/paths"
import { abs, exp, hypot, pi, pow, sqrt } from "mathjs"
import { BlurFilter, Container, Graphics, IPointData } from "pixi.js"
import { map } from "utils/map"
import { noise2d, random } from "utils/random"

//TODO: Rewrite to WebGL

run((params) => {
  const noise = noise2d()
  const xBound = 2
  const scaleFactor = (params.width * 0.5) / xBound
  const mainHue = random.real(0, 360)
  const lip = (a: number, b: number, sign: boolean) => (x: number) =>
    (sqrt(a / exp(pow(x * x - b, 2))) as number) * (sign ? 1 : -1)
  const upper = lip(random.real(0.5, 1), random.real(0.5, 1), true)
  const lower = lip(random.real(0.5, 1), random.real(0, 0.5), false)

  const container = new Container()
  container.angle = random.real(-15, 15)
  drawBackground()
  drawPolygons()
  drawLipsGraph()
  return { container }

  function drawBackground() {
    const backHue = ((mainHue + 180) % 360) + random.real(-20, 20)
    const backColor = { h: backHue, s: random.real(10, 30), v: random.real(70, 90) }
    const backContainer = new Container()
    setBackground(backContainer, backColor, { width: params.width * 2, height: params.height * 2 })

    const boundsDiagonal = hypot(params.width, params.height)
    for (let i = 0; i < 20; i++) {
      const { x, y, radius, color, numVertices } =
        i < 10
          ? {
              x: random.real(-params.width / 4, params.width / 4),
              y: random.real(-params.height / 4, params.height / 4),
              radius: random.real(boundsDiagonal * 0.25, boundsDiagonal * 0.5),
              color: { h: backHue, s: random.real(10, 30), v: random.real(70, 90), a: random.real(0.3, 0.7) },
              numVertices: random.integer(5, 15),
            }
          : {
              x: random.real(params.width / 4, params.width / 2) * random.sign(),
              y: random.real(params.height / 4, params.height / 2) * random.sign(),
              radius: random.real(boundsDiagonal * 0.1, boundsDiagonal * 0.2),
              color: { h: backHue, s: random.real(30, 50), v: random.real(50, 70), a: random.real(0.1, 0.3) },
              numVertices: random.integer(15, 25),
            }
      backContainer.addChild(new Graphics().beginFill(color).drawPolygon(randomPolygon(numVertices, radius, { x, y })))
    }
    backContainer.addChild(paperTexture())
    container.addChild(backContainer)
  }

  function paperTexture() {
    const paperContainer = new Container()
    const textureCount = (params.width * params.height) / 100
    for (let i = 0; i < textureCount; i++) {
      const strokeColor = gray(random.real(100, 150))
      const alpha = 0.05
      const [x, y] = [
        random.real(-params.width * 0.7, params.width * 0.7),
        random.real(-params.height * 0.7, params.height * 0.7),
      ]
      const rotation = random.real(0, pi * 2)
      paperContainer.addChild(
        new Graphics()
          .setTransform(x, y, 1, 1, rotation)
          .beginFill(strokeColor, alpha)
          .drawCircle(0, 0, 3)
          .endFill()
          .lineStyle(1, strokeColor, alpha)
          .moveTo(random.real(60, 220), 0)
          .bezierCurveTo(
            0,
            random.real(-50, 50),
            random.real(-50, 50),
            random.real(60, 120),
            random.real(60, 120),
            random.real(60, 220)
          )
      )
    }
    return paperContainer
  }

  function drawPolygons() {
    const polygons = new Container()
    const numPolygons = 3000
    for (let i = 0; i < numPolygons; i++) {
      const [x, y] = [random.real(-xBound, xBound), random.real(-xBound / 2, xBound / 2)]
      if (y > upper(x) || y < lower(x)) {
        i--
        continue
      }
      const yNorm = y / (y > 0 ? upper(x) : lower(x))
      const n = noise(x, y)
      const center = { x: x * scaleFactor, y: y * scaleFactor }
      const radius = map(pow(yNorm, 1 / 3), 0, 1, 15, 30)
      const color = {
        h: mainHue,
        s: map(n, 0, 1, 85, 100),
        v: map(abs(yNorm - 0.5) * 2, 0, 1, 100, 50),
        a: random.real(0.5, 1),
      }
      const numVertices = random.integer(3, 9)
      polygons.addChild(new Graphics().beginFill(color).drawPolygon(randomPolygon(numVertices, radius, center)))
    }
    polygons.filters = [new BlurFilter(1)]
    container.addChild(polygons)
  }

  function drawLipsGraph() {
    const lips = [upper, lower].map((f) => plot(f, -xBound, xBound))
    lips.forEach((graph) => {
      graph.scale(scaleFactor, [0, 0])
      graph.strokeWidth = 3
      graph.dashArray = Array.from({ length: random.integer(3, 7) }, (_) => random.integer(10, 40))
      graph.strokeColor = new Color("black")
      const graphics = drawPath(graph)
      graphics.alpha = 0.5
      params.debug && container.addChild(graphics)
    })
  }

  function randomPolygon(numVertices: number, radius: number, center: IPointData): IPointData[] {
    const thetas = Array.from({ length: numVertices }, (_) => random.real(0, 2 * pi)).sort()
    return thetas.map((theta) => {
      const { x, y } = fromPolar(radius, theta)
      return { x: x + center.x, y: y + center.y }
    })
  }
})
