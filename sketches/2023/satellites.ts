import { drawPath } from "drawing/pixi";
import { Color, Ellipse, Path, Point, Rectangle } from "geometry/paths";
import { cos, cube, multiply, norm, pi, sin, sqrt, square, subtract, unaryMinus } from "mathjs";
import { Attractor, Mover, TwoBodySystem, Vector2, Vector2Like } from "physics/forces";
import { Container, Graphics } from "pixi.js";
import { random } from "util/random";
import { Params, run } from "drawing/sketch";

//TODO: Colors from noise, gradient
//TODO: Spinning stars in the background
//TODO: VHS effect
//MAYBE:
// Echo waves from rectangle sides
// Display bodies as arcs, instead of circles
// Wavy rectangle sides (from noise)

class PlanetarySystem extends TwoBodySystem {
  private initialSize: Rectangle;
  private rectGraphics: Graphics;

  constructor(private sun: Sun, private satellite: Satellite, private orbit: Orbit) {
    super(sun, satellite);

    this.initialSize = new Rectangle(this.sun.position, this.satellite.position);
    this.rectGraphics = new Graphics()
      .beginFill(0x0000ff, 0.5)
      .drawRect(0, 0, this.initialSize.width, this.initialSize.height);
    this.rectGraphics.position = this.sun.position;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    const scaleVector = this.satellite.position
      .subtract(this.sun.position)
      .divide([this.initialSize.width, this.initialSize.height]);
    this.rectGraphics.scale.set(scaleVector.x, scaleVector.y);
  }

  draw(debug: boolean): Container {
    const container = new Container();
    container.position = this.orbit.position;
    container.angle = this.orbit.rotationAngle;

    container.addChild(this.rectGraphics);
    if (debug) {
      this.orbit.shape.strokeColor = new Color("red");
      container.addChild(this.sun.graphics);
      container.addChild(this.satellite.graphics);
      container.addChild(drawPath(this.orbit.shape));
    }
    return container;
  }
}

interface OrbitParams {
  readonly position: Point;
  readonly semiMajor: number;
  readonly semiMinor: number;
  readonly periodSeconds: number;
  readonly rotationAngle: number;
}

class Orbit implements OrbitParams {
  readonly eccentricity: number;
  readonly foci: Vector2[];
  readonly shape: Path;

  private constructor(
    readonly position: Point,
    readonly semiMajor: number,
    readonly semiMinor: number,
    readonly periodSeconds: number,
    readonly rotationAngle: number
  ) {
    const focus = [sqrt(square(this.semiMajor) - square(this.semiMinor)) as number, 0] as Vector2;
    this.eccentricity = sqrt(1 - square(this.semiMinor) / square(this.semiMajor)) as number;
    this.foci = [focus, unaryMinus(focus) as Vector2];
    this.shape = new Ellipse({ center: [0, 0], radius: [this.semiMajor, this.semiMinor] });
  }

  static fromParams(params: OrbitParams): Orbit {
    return new Orbit(params.position, params.semiMajor, params.semiMinor, params.periodSeconds, params.rotationAngle);
  }
}

class Satellite extends Mover {
  readonly graphics: Graphics;

  constructor(position: Vector2Like, velocity: Vector2Like) {
    super(position, velocity);
    this.graphics = new Graphics().beginFill(0xff0000).lineStyle(0).drawCircle(0, 0, 3);
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.graphics.position = this.position;
  }
}

class Sun extends Attractor {
  readonly graphics: Graphics;

  constructor(position: Vector2Like, mass: number) {
    super(position, mass);
    this.graphics = new Graphics().beginFill(0x000000).drawCircle(this.position.x, this.position.y, 10);
  }
}

run((params) => {
  const system = fromOrbit({
    position: new Point(0, 0),
    semiMajor: 200,
    semiMinor: 150,
    rotationAngle: 0,
    periodSeconds: 5,
  });
  const update = (deltaTime: number) => system.update(deltaTime);

  const container = new Container();
  container.addChild(system.draw(params.debug));
  return { container, update };
}, Params.DEBUG);

function fromOrbit(orbitParams: OrbitParams): PlanetarySystem {
  const orbit = Orbit.fromParams(orbitParams);
  const mu = (4 * square(pi) * cube(orbit.semiMajor)) / square(orbit.periodSeconds);
  const theta = random.real(0, pi * 2);

  const sunPosition = random.pick(orbit.foci);
  const satellitePosition = [orbit.semiMajor * cos(theta), orbit.semiMinor * sin(theta)] as Vector2;
  const satelliteVelocity = initialVelocity(orbit, subtract(satellitePosition, sunPosition), theta, mu);
  return new PlanetarySystem(new Sun(sunPosition, mu), new Satellite(satellitePosition, satelliteVelocity), orbit);
}

// https://en.wikipedia.org/wiki/Kepler%27s_laws_of_planetary_motion#Position_as_a_function_of_time
function initialVelocity(orbit: Orbit, heliocentricVector: Vector2, theta: number, mu: number): Vector2 {
  const [r, a, e] = [norm(heliocentricVector) as number, orbit.semiMajor, orbit.eccentricity];
  const scalar = (sqrt(mu * a) as number) / r;
  const vector = [-sin(theta), (sqrt(1 - square(e)) as number) * cos(theta)] as Vector2;
  return multiply(vector, scalar * random.sign());
}
