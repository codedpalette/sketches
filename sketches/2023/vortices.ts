import { hsv } from "color-convert";
import { setBackground } from "drawing/pixi";
import { run } from "drawing/sketch";
import { fromPolar } from "geometry/angles";
import { abs, hypot, pi, pow, sin } from "mathjs";
import { Container, Graphics } from "pixi.js";
import { map } from "util/map";
import { noise2d, random } from "util/random";

run((params) => {
  const n = noise2d();
  const container = new Container();
  setBackground(container, "black", params);

  const baseTheta = random.real(0, 2 * pi);
  const baseHue = random.real(0, 360);
  const numVortices = 1;
  const hypotenuse = hypot(params.width / 2, params.height / 2);
  for (let i = 0; i < numVortices; i++) {
    const hue = (baseHue + (360 * i) / numVortices + random.real(-10, 10)) % 360;
    const vortex = container.addChild(drawVortex(hue));
    const r = random.real(hypotenuse / 4, hypotenuse / 2);
    const theta = (2 * pi * i) / numVortices + baseTheta;
    const { x, y } = fromPolar(r, theta);
    //vortex.position.set(x, y);
  }

  return { container };

  //TODO: Try bezier curves for particle trails

  function drawVortex(hue: number) {
    const particleCount = random.real(200, 300);
    const maxRadius = random.real(400, 500);
    const minRadius = 10;
    const thetaStep = 0.01;
    const trailLength = 50;
    const valPeriod = 100;

    const sat = random.real(25, 100);
    const val = random.real(50, 100);
    const g = new Graphics();
    for (let i = 0; i < particleCount; i++) {
      const r = map(pow(random.realZeroToOneInclusive(), 1 / 2), 0, 1, minRadius, maxRadius);
      const theta = random.real(0, 2 * pi);
      const length = trailLength;

      const valTheta = map((r - minRadius) % valPeriod, 0, valPeriod, 0, 2 * pi);
      const valOffset = map(abs(sin(valTheta)), 0, 1, 50, 0); //cos(valTheta) * 25;
      for (let j = 0; j < length; j++) {
        const { x, y } = fromPolar(r, theta + j * thetaStep);
        const color = hsv.hex([hue, sat, val - valOffset]);
        g.beginFill(color, 0.5).drawCircle(x, y, 0.5 + n(j, i * 100) + i / length);
      }
    }
    return g;
  }
});
