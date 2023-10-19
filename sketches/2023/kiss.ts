import { run, SketchFactory } from "core/sketch"
import { drawBackground, gray } from "drawing/helpers"
import { fromPolar } from "geometry/helpers"
import { BlurFilter, Container, Graphics, IPointData } from "pixi.js"
import { map } from "utils/helpers"
import { noise2d } from "utils/random"

const sketch: SketchFactory = ({ random, params }) => {
  const noise = noise2d(random)
  const xBound = 2
  const scaleFactor = (params.width * 0.5) / xBound
  const mainHue = random.real(0, 360)
  const lip = (a: number, b: number, sign: boolean) => (x: number) =>
    Math.sqrt(a / Math.exp(Math.pow(x * x - b, 2))) * (sign ? 1 : -1)
  const upper = lip(random.real(0.5, 1), random.real(0.5, 1), true)
  const lower = lip(random.real(0.5, 1), random.real(0, 0.5), false)

  const container = new Container()
  container.angle = random.real(-15, 15)
  background()
  polygons()
  return { container }

  function background() {
    const backHue = ((mainHue + 180) % 360) + random.real(-20, 20)
    const backColor = { h: backHue, s: random.real(10, 30), v: random.real(70, 90) }
    const backContainer = new Container()
    backContainer.addChild(drawBackground(backColor, params))

    const boundsDiagonal = Math.hypot(params.width, params.height)
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
    backContainer.addChild(texture())
    container.addChild(backContainer)
  }

  function polygons() {
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
      const radius = map(Math.pow(yNorm, 1 / 3), 0, 1, 20, 30)
      const color = {
        h: mainHue + random.minmax(10),
        s: map(n, -1, 1, 85, 100),
        v: map(Math.abs(yNorm - 0.5) * 2, 0, 1, 100, 50),
        a: random.real(0.5, 1),
      }
      const numVertices = random.integer(3, 9)
      polygons.addChild(new Graphics().beginFill(color).drawPolygon(randomPolygon(numVertices, radius, center)))
    }
    polygons.filters = [new BlurFilter(1, 2)]
    container.addChild(polygons)
  }

  function texture() {
    const textureContainer = new Container()
    const textureCount = (params.width * params.height) / 500
    for (let i = 0; i < textureCount; i++) {
      const strokeColor = gray(random.real(100, 150))
      const alpha = 0.05
      const [x, y] = [
        random.real(-params.width * 0.7, params.width * 0.7),
        random.real(-params.height * 0.7, params.height * 0.7),
      ]
      const rotation = random.real(0, Math.PI * 2)

      Graphics.curves.adaptive = true
      const curveContainer = textureContainer.addChild(new Container().setTransform(x, y, 1, 1, rotation))
      curveContainer.addChild(new Graphics().beginFill(strokeColor, alpha).drawCircle(0, 0, 3))
      curveContainer.addChild(
        new Graphics()
          .lineStyle(2, strokeColor, alpha)
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
    return textureContainer
  }

  function randomPolygon(numVertices: number, radius: number, center: IPointData): IPointData[] {
    const thetas = Array.from({ length: numVertices }, (_) => random.real(0, 2 * Math.PI)).sort()
    return thetas.map((theta) => {
      const { x, y } = fromPolar(radius, theta)
      return { x: x + center.x, y: y + center.y }
    })
  }
}

run(sketch)
