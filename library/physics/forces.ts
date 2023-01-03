import is from "@sindresorhus/is";
import { Point } from "geometry/paper";
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
  private _position: Point;
  private _mass: number;

  constructor(position: Vector2Like, mass: number) {
    this._position = new Point(position);
    this._mass = mass;
  }

  get position() {
    return this._position;
  }

  get mass() {
    return this._mass;
  }
}

export abstract class Attractor extends Body {
  constructor(position: Vector2Like, mass: number) {
    super(position, mass);
  }

  attract(body: BodyLike): Vector2 {
    const forceVector = this.position.subtract(body.position);
    const strength = (this.mass * body.mass) / square(forceVector.length);
    const force = forceVector.normalize(strength);
    return [force.x, force.y];
  }
}

export abstract class Mover extends Body {
  private location: Point;
  private velocity: Vector2;
  private acceleration: Vector2 = [0, 0];

  constructor(position: Vector2Like, velocity: Vector2Like, mass = 1.0) {
    super(position, mass);
    this.location = new Point(position);
    this.velocity = toVector(velocity);
  }

  get position() {
    return this.location;
  }

  applyForce(force: Vector2Like) {
    this.acceleration = add(this.acceleration, divide(toVector(force), this.mass));
  }

  update(deltaTime: number) {
    this.velocity = add(this.velocity, multiply(this.acceleration, deltaTime));
    this.location = this.location.add(multiply(this.velocity, deltaTime));
    this.acceleration = [0, 0];
  }
}

export abstract class TwoBodySystem {
  private attractor: Attractor;
  private mover: Mover;

  constructor(attractor: Attractor, mover: Mover) {
    this.attractor = attractor;
    this.mover = mover;
  }

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
