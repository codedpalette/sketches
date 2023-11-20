import { run, SketchFactory } from "core/sketch"
import { fromPolar } from "geometry"
import { Container, FXAAFilter, Graphics } from "pixi.js"
import { noise2d } from "random"
import { map } from "utils"

//TODO: Add comments, finish
const sketch: SketchFactory = ({ random }) => {
  const noise = noise2d(random)
  const container = new Container()
  container.addChild(drawVortex())
  container.filters = [new FXAAFilter()]
  return { container }

  // https://en.wikipedia.org/wiki/Rankine_vortex
  function drawVortex() {
    const particleCount = 100
    const thetaStep = 0.01

    const maxRadius = random.real(300, 500)
    const minRadius = random.real(20, 50)
    const trailLength = random.real(15, 30) * 2

    const vortexCoreRadius = maxRadius * random.real(0.25, 0.75)
    const gamma = random.real(0.2, 0.4)

    const c = new Container()
    for (let i = 0; i < particleCount; i++) {
      let r = map(random.realZeroToOneInclusive(), 0, 1, minRadius, maxRadius)
      let theta = random.real(0, 2 * Math.PI)
      //const g = c.addChild(new Graphics())
      for (let j = 0; j < trailLength; j++) {
        const rotationalVelocity =
          (gamma / (2 * Math.PI)) * (r <= vortexCoreRadius ? r / Math.pow(vortexCoreRadius, 2) : 1 / r)
        const rStep = rotationalVelocity / thetaStep

        const { x: x0, y: y0 } = fromPolar(r, theta)
        const { x: x1, y: y1 } = fromPolar(r + rStep, theta - thetaStep)

        const lineThickness = (1 + noise(i * 100, j) + j / trailLength) * 2
        const alpha = j / (trailLength * 2) + 0.5
        c.addChild(new Graphics()).lineStyle(lineThickness, "white", alpha).moveTo(x0, y0).lineTo(x1, y1)

        theta += thetaStep
        r -= rStep
      }
    }
    return c
  }
}

run(sketch)
