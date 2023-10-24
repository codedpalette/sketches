import { run, SketchFactory } from "core/sketch"
import { drawBackground } from "drawing/helpers"
import { fromPolar } from "geometry"
import { BlurFilter, Container, Graphics, IPointData } from "pixi.js"
import { noise2d } from "random"
import { map } from "utils"

const sketch: SketchFactory = ({ random, bbox }) => {
  const noise = noise2d(random)
  const xBound = 2
  const scaleFactor = (bbox.width * 0.5) / xBound
  const mainHue = random.real(0, 360)
  const lip = (a: number, b: number, sign: boolean) => (x: number) =>
    Math.sqrt(a / Math.exp(Math.pow(x * x - b, 2))) * (sign ? 1 : -1)
  const upper = lip(random.real(0.5, 1), random.real(0.5, 1), true)
  const lower = lip(random.real(0.5, 1), random.real(0, 0.5), false)

  const container = new Container()
  container.angle = random.real(-15, 15)
  container.addChild(background())
  container.addChild(polygons())
  return { container }

  function background() {
    const backHue = ((mainHue + 180) % 360) + random.real(-20, 20)
    const backColor = { h: backHue, s: random.real(10, 30), v: random.real(70, 90) }
    const backContainer = new Container()
    backContainer.addChild(drawBackground(backColor, bbox))

    const boundsDiagonal = Math.hypot(bbox.width, bbox.height)
    for (let i = 0; i < 20; i++) {
      const { x, y, radius, color, numVertices } =
        i < 10
          ? {
              x: random.real(-bbox.width / 4, bbox.width / 4),
              y: random.real(-bbox.height / 4, bbox.height / 4),
              radius: random.real(boundsDiagonal * 0.25, boundsDiagonal * 0.5),
              color: { h: backHue, s: random.real(10, 30), v: random.real(70, 90), a: random.real(0.3, 0.7) },
              numVertices: random.integer(5, 15),
            }
          : {
              x: random.real(bbox.width / 4, bbox.width / 2) * random.sign(),
              y: random.real(bbox.height / 4, bbox.height / 2) * random.sign(),
              radius: random.real(boundsDiagonal * 0.1, boundsDiagonal * 0.2),
              color: { h: backHue, s: random.real(30, 50), v: random.real(50, 70), a: random.real(0.1, 0.3) },
              numVertices: random.integer(15, 25),
            }
      backContainer.addChild(new Graphics().beginFill(color).drawPolygon(randomPolygon(numVertices, radius, { x, y })))
    }
    return backContainer
  }

  function polygons() {
    const polygons = new Container()
    const numPolygons = 2000
    for (let i = 0; i < numPolygons; i++) {
      const [x, y] = [random.real(-xBound, xBound), random.real(-xBound / 2, xBound / 2)]
      if (y > upper(x) || y < lower(x)) {
        i--
        continue
      }
      const yNorm = y / (y > 0 ? upper(x) : lower(x))
      const n = noise(x, y)
      const center = { x: x * scaleFactor, y: y * scaleFactor }
      const radius = map(Math.pow(yNorm, 1 / 3), 0, 1, 30, 40)
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
    return polygons
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
