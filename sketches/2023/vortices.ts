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
  const numVortices = 3;
  const hypotenuse = hypot(params.width / 2, params.height / 2);
  for (let i = 0; i < numVortices; i++) {
    const hue = (baseHue + (360 * i) / numVortices + random.real(-10, 10)) % 360;
    const vortex = container.addChild(drawVortex(hue));
    const r = random.real(hypotenuse / 4, hypotenuse / 2);
    const theta = (2 * pi * i) / numVortices + baseTheta;
    const { x, y } = fromPolar(r, theta);
    //TODO: Composition
    vortex.position.set(x, y);
  }

  return { container };

  function drawVortex(hue: number) {
    const particleCount = random.real(200, 300);
    const maxRadius = random.real(400, 500);
    const minRadius = 30;
    const thetaStep = 0.001;
    const trailLength = 1000;
    const valPeriod = 10;

    const sat = random.real(25, 100);
    const val = random.real(50, 100);

    const vortexCoreRadius = maxRadius / 4;
    const gamma = random.real(0.03, 0.09);
    const c = new Container();
    for (let i = 0; i < particleCount; i++) {
      let r = map(random.realZeroToOneInclusive(), 0, 1, minRadius, maxRadius);
      let theta = random.real(0, 2 * pi);

      const valTheta = map((r - minRadius) % valPeriod, 0, valPeriod, 0, 2 * pi); //TODO: Color variations
      const valOffset = map(abs(sin(valTheta)), 0, 1, 50, 0); //cos(valTheta) * 25;

      const g = c.addChild(new Graphics());
      for (let j = 0; j < trailLength; j++) {
        const rotationalVelocity = (gamma / (2 * pi)) * (r <= vortexCoreRadius ? r / pow(vortexCoreRadius, 2) : 1 / r);
        const { x, y } = fromPolar(r, theta);
        const color = hsv.hex([hue, sat, val - valOffset]);
        const lineThickness = (1 + n(i * 100, j) + j / trailLength) * 2;
        g.lineStyle(lineThickness, color, random.real(0.5, 1));
        j == 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        theta += thetaStep;
        r -= rotationalVelocity / thetaStep;
      }
    }
    return c;
  }
});
