import is from "@sindresorhus/is";
import { Point } from "geometry";
import { add, divide, min, multiply, square } from "mathjs";

export type Vector2 = [number, number];
export type Vector2Like = Vector2 | { x: number; y: number };

function toVector(vectorLike: Vector2Like): Vector2 {
  return is.array(vectorLike) ? vectorLike : [vectorLike.x, vectorLike.y];
}

interface BodyLike {
  readonly position: Point;
  readonly mass: number;
}

abstract class Body implements BodyLike {
  readonly position: Point;

  constructor(positionVec: Vector2Like, readonly mass: number) {
    this.position = new Point(positionVec);
  }
}

export abstract class Attractor extends Body {
  attract(body: BodyLike): Vector2 {
    const forceVector = this.position.subtract(body.position);
    const strength = (this.mass * body.mass) / square(forceVector.length);
    const force = forceVector.normalize(strength);
    return [force.x, force.y];
  }
}

export abstract class Mover extends Body {
  private velocity: Vector2;
  private acceleration: Vector2 = [0, 0];

  constructor(positionVec: Vector2Like, velocityVec: Vector2Like, mass = 1.0) {
    super(positionVec, mass);
    this.velocity = toVector(velocityVec);
  }

  applyForce(force: Vector2Like) {
    this.acceleration = add(this.acceleration, divide(toVector(force), this.mass));
  }

  update(deltaTime: number) {
    this.velocity = add(this.velocity, multiply(this.acceleration, deltaTime));
    this.position.set(this.position.add(multiply(this.velocity, deltaTime)));
    this.acceleration = [0, 0];
  }
}

export abstract class TwoBodySystem {
  constructor(private attractor: Attractor, private mover: Mover) {}

  update(deltaTime: number) {
    let time = deltaTime;
    do {
      const timeStep = min(time, 0.001);
      const force = this.attractor.attract(this.mover);
      this.mover.applyForce(force);
      this.mover.update(timeStep);
      time -= timeStep;
    } while (time > 0);
  }
}
