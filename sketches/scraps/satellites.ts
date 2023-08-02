import { setBackground } from "drawing/pixi"
import { Params, run } from "drawing/sketch"
import { Point } from "geometry/paths"
import { Vector2, Vector2Like } from "geometry/vectors"
import { abs, cos, cube, multiply, norm, pi, sin, sqrt, square, subtract, unaryMinus } from "mathjs"
import { Attractor, Mover, TwoBodySystem } from "physics/forces"
import { Container, Graphics } from "pixi.js"
import { random } from "utils/random"

class Sun extends Attractor {
  readonly graphics: Graphics

  constructor(position: Vector2Like, mass: number) {
    super(position, mass)
    this.graphics = new Graphics().beginFill(0x000000).drawCircle(this.position.x, this.position.y, 10)
  }
}

class Satellite extends Mover {
  readonly graphics: Graphics

  constructor(position: Vector2Like, velocity: Vector2Like) {
    super(position, velocity)
    this.graphics = new Graphics().beginFill(0xff0000).lineStyle(0).drawCircle(0, 0, 3)
  }

  update(deltaTime: number): void {
    super.update(deltaTime)
    this.graphics.position = this.position
  }
}

interface OrbitParams {
  readonly position: Point
  readonly semiMajor: number
  readonly semiMinor: number
  readonly periodSeconds: number
  readonly rotationAngle: number
}

class Orbit implements OrbitParams {
  readonly eccentricity: number
  readonly foci: Vector2[]
  readonly graphics: Graphics

  private constructor(
    readonly position: Point,
    readonly semiMajor: number,
    readonly semiMinor: number,
    readonly periodSeconds: number,
    readonly rotationAngle: number
  ) {
    const focus = [sqrt(square(this.semiMajor) - square(this.semiMinor)) as number, 0] as Vector2
    this.eccentricity = sqrt(1 - square(this.semiMinor) / square(this.semiMajor)) as number
    this.foci = [focus, unaryMinus(focus) as Vector2]
    this.graphics = new Graphics().lineStyle(1, "red").drawEllipse(0, 0, this.semiMajor, this.semiMinor)
    this.graphics.cacheAsBitmap = true
  }

  static fromParams(params: OrbitParams): Orbit {
    return new Orbit(params.position, params.semiMajor, params.semiMinor, params.periodSeconds, params.rotationAngle)
  }
}

class PlanetarySystem extends TwoBodySystem {
  private rectGraphics: Graphics

  constructor(private sun: Sun, private satellite: Satellite, private orbit: Orbit) {
    super(sun, satellite)
    this.rectGraphics = new Graphics()
    this.rectGraphics.position = this.sun.position
  }

  update(deltaTime: number): void {
    super.update(deltaTime)
    const rect = this.satellite.position.subtract(this.sun.position)
    this.rectGraphics
      .clear()
      .beginFill(0x0000ff, 0.5)
      .drawRect(0, 0, abs(rect.x), abs(rect.y))
      .scale.set(rect.x < 0 ? -1 : 1, rect.y < 0 ? -1 : 1)
  }

  draw(debug: boolean): Container {
    const container = new Container()
    container.position = this.orbit.position
    container.angle = this.orbit.rotationAngle

    container.addChild(this.rectGraphics)
    if (debug) {
      container.addChild(this.sun.graphics)
      container.addChild(this.satellite.graphics)
      container.addChild(this.orbit.graphics)
    }
    return container
  }
}

// Add
// - Debug deviations from orbit
// - Composition of orbits
// - Colors from noise, gradient
// - Spinning stars in the background
// - VHS effect
// - Echo waves from rectangle sides
// - Display bodies as arcs, instead of circles
// - Wavy rectangle sides (from noise)

run((params) => {
  const systems = Array.from({ length: 30 }, () => {
    const semiMajor = random.real(100, 150)
    const w = params.width / 2 - 100
    const h = params.height / 2 - 100
    return fromOrbit({
      position: new Point(random.real(-w, w), random.real(-h, h)),
      semiMajor,
      semiMinor: random.real(50, semiMajor),
      rotationAngle: random.real(0, 360),
      periodSeconds: random.real(5, 15),
    })
  })
  const update = (deltaTime: number) => systems.forEach((system) => system.update(deltaTime))
  const container = new Container()
  setBackground(container, "white", params)
  systems.forEach((system) => container.addChild(system.draw(params.debug)))
  return { container, update }
}, Params.DEBUG)

function fromOrbit(orbitParams: OrbitParams): PlanetarySystem {
  const orbit = Orbit.fromParams(orbitParams)
  const mu = (4 * square(pi) * cube(orbit.semiMajor)) / square(orbit.periodSeconds)
  const theta = random.real(0, pi * 2)

  const sunPosition = random.pick(orbit.foci)
  const satellitePosition = [orbit.semiMajor * cos(theta), orbit.semiMinor * sin(theta)] as Vector2
  const satelliteVelocity = initialVelocity(orbit, subtract(satellitePosition, sunPosition), theta, mu)
  return new PlanetarySystem(new Sun(sunPosition, mu), new Satellite(satellitePosition, satelliteVelocity), orbit)
}

// https://en.wikipedia.org/wiki/Kepler%27s_laws_of_planetary_motion#Position_as_a_function_of_time
function initialVelocity(orbit: Orbit, heliocentricVector: Vector2, theta: number, mu: number): Vector2 {
  const [r, a, e] = [norm(heliocentricVector) as number, orbit.semiMajor, orbit.eccentricity]
  const scalar = (sqrt(mu * a) as number) / r
  const vector = [-sin(theta), (sqrt(1 - square(e)) as number) * cos(theta)] as Vector2
  return multiply(vector, scalar * random.sign())
}
