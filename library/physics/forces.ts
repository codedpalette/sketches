import { Point } from "geometry/paths"
import { toVector, Vector2, Vector2Like } from "geometry/vectors"
import { add, divide, max, multiply } from "mathjs"

interface BodyLike {
  readonly position: Point
  readonly mass: number
}

abstract class Body implements BodyLike {
  readonly position: Point

  constructor(positionVec: Vector2Like, readonly mass: number) {
    this.position = new Point(positionVec)
  }
}

export abstract class Attractor extends Body {
  attract(body: BodyLike): Vector2 {
    const forceVector = this.position.subtract(body.position)
    const distance = max(forceVector.length, 5)
    const strength = (this.mass * body.mass) / (distance * distance)
    const force = forceVector.normalize(strength)
    return [force.x, force.y]
  }
}

export abstract class Mover extends Body {
  private velocity: Vector2
  private acceleration: Vector2 = [0, 0]

  constructor(positionVec: Vector2Like, velocityVec: Vector2Like, mass = 1.0) {
    super(positionVec, mass)
    this.velocity = toVector(velocityVec)
  }

  applyForce(force: Vector2Like) {
    this.acceleration = add(this.acceleration, divide(toVector(force), this.mass))
  }

  update(deltaTime: number) {
    this.velocity = add(this.velocity, multiply(this.acceleration, deltaTime))
    this.position.set(this.position.add(multiply(this.velocity, deltaTime)))
    this.acceleration = [0, 0]
  }
}

export abstract class TwoBodySystem {
  constructor(private attractor: Attractor, private mover: Mover) {}

  update(deltaTime: number) {
    const force = this.attractor.attract(this.mover)
    this.mover.applyForce(force)
    this.mover.update(deltaTime)
  }
}
