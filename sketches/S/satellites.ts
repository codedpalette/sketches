import { drawPath } from "drawing/helpers";
import { Sketch2D } from "drawing/sketch";
import { Ellipse, Point, Rectangle } from "geometry/paper";
import { cos, cube, multiply, pi, sin, sqrt, square, subtract, unaryMinus } from "mathjs";
import { Color } from "paper/dist/paper-core";
import { Attractor, Mover, TwoBodySystem, Vector2 } from "physics/forces";
import { Container, DisplayObject, Graphics } from "pixi.js";
import { Random } from "random-js";

class Sun extends Attractor {
  draw(): Graphics {
    return new Graphics().beginFill(0x000000).drawCircle(this.position.x, this.position.y, 10);
  }
}

class Satellite extends Mover {
  draw(): Graphics {
    return new Graphics().beginFill(0xff0000).lineStyle(0).drawCircle(this.position.x, this.position.y, 3);
  }
}

interface OrbitParams {
  position: Point;
  semiMajor: number;
  semiMinor: number;
  periodSeconds: number;
  rotationAngle: number;
}

class Orbit implements OrbitParams {
  readonly position: Point;
  readonly semiMajor: number;
  readonly semiMinor: number;
  readonly periodSeconds: number;
  readonly rotationAngle: number;
  readonly eccentricity: number;
  readonly foci: Vector2[];
  readonly shape: Ellipse;

  constructor(orbitParams: OrbitParams) {
    ({
      position: this.position,
      semiMajor: this.semiMajor,
      semiMinor: this.semiMinor,
      periodSeconds: this.periodSeconds,
      rotationAngle: this.rotationAngle,
    } = orbitParams);
    this.eccentricity = sqrt(1 - square(this.semiMinor) / square(this.semiMajor)) as number;
    const focus = [sqrt(square(this.semiMajor) - square(this.semiMinor)) as number, 0] as Vector2;
    this.foci = [focus, unaryMinus(focus) as Vector2];
    this.shape = new Ellipse({ center: [0, 0], radius: [this.semiMajor, this.semiMinor] });
  }
}

class PlanetarySystem extends TwoBodySystem {
  private sun: Sun;
  private satellite: Satellite;
  private orbit: Orbit;

  private constructor(sun: Sun, satellite: Satellite, orbit: Orbit) {
    super(sun, satellite);
    this.sun = sun;
    this.satellite = satellite;
    this.orbit = orbit;
  }

  static fromOrbit(orbitParams: OrbitParams, random: Random): PlanetarySystem {
    const orbit = new Orbit(orbitParams);
    const mu = (4 * square(pi) * cube(orbit.semiMajor)) / square(orbit.periodSeconds);
    const sunPosition = random.pick(orbit.foci);
    const sun = new Sun(sunPosition, mu);

    const theta = random.real(0, pi * 2);
    const satellitePosition = [orbit.semiMajor * cos(theta), orbit.semiMinor * sin(theta)] as Vector2;
    const satelliteVelocity = this.calculateInitialVelocity(orbit, sunPosition, satellitePosition, theta, mu);
    const satellite = new Satellite(satellitePosition, satelliteVelocity);

    return new PlanetarySystem(sun, satellite, orbit);
  }

  private static calculateInitialVelocity(
    orbit: Orbit,
    sunPosition: Vector2,
    satellitePosition: Vector2,
    theta: number,
    mu: number
  ): Vector2 {
    const heliocentricVector = subtract(satellitePosition, sunPosition);
    const r = new Point(heliocentricVector).length;
    const a = orbit.semiMajor;
    const e = orbit.eccentricity;

    const scalar = (sqrt(mu * a) as number) / r;
    const vector = [-sin(theta), (sqrt(1 - square(e)) as number) * cos(theta)] as Vector2;
    return multiply(vector, scalar); //TODO: Add random sign
  }

  draw(debug: boolean): Graphics {
    const graphics = new Graphics();
    graphics.position = this.orbit.position;
    graphics.rotation = this.orbit.rotationAngle;

    const rect = new Rectangle(this.sun.position, this.satellite.position);
    graphics.beginFill(0x0000ff, 0.5).drawRect(rect.topLeft.x, rect.topLeft.y, rect.width, rect.height);
    if (debug) {
      this.orbit.shape.strokeColor = new Color("red");
      graphics.addChild(this.sun.draw()).addChild(this.satellite.draw()).addChild(drawPath(this.orbit.shape));
    }
    return graphics;
  }
}

class Satellites extends Sketch2D {
  private system: PlanetarySystem;
  private container: Container;

  constructor(debug = false) {
    super(debug);
    this.system = PlanetarySystem.fromOrbit(
      {
        position: new Point(0, 0),
        semiMajor: 300,
        semiMinor: 150,
        rotationAngle: 0,
        periodSeconds: 5,
      },
      this.random
    );
    this.container = new Container();
  }

  protected setup(): Container<DisplayObject> {
    this.container.addChild(this.system.draw(this.debug));
    return this.container;
  }

  protected update(deltaTime: number): void {
    //TODO: Performance, maybe switch browser?
    this.system.update(deltaTime);
    this.container.removeChildren();
    this.container.addChild(this.system.draw(this.debug));
  }
}

new Satellites(true).draw();
