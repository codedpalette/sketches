import { hsv } from "color-convert";
import { renderCanvas } from "drawing/pixi";
import { run } from "drawing/sketch";
import { fromPolar } from "geometry/angles";
import { abs, cos, hypot, pi, pow, sin, tan } from "mathjs";
import { BlurFilter, Container, Graphics, NoiseFilter } from "pixi.js";
import { map } from "util/map";
import { noise2d, random } from "util/random";

run((params) => {
  const n = noise2d();
  const container = new Container();
  container.addChild(drawBackground());
  container.addChild(drawStars());

  const baseTheta = random.real(0, 2 * pi);
  const baseHue = random.real(0, 360);
  const numVortices = 3;
  const hypotenuse = hypot(params.width / 2, params.height / 2);
  for (let i = 0; i < numVortices; i++) {
    const hue = baseHue + random.real(-30, 30);
    const r = random.real(hypotenuse / 4, hypotenuse / 2);
    const theta = (2 * pi * i) / numVortices + baseTheta;
    const { x, y } = fromPolar(r, theta);
    const vortex = container.addChild(drawVortex(hue));
    vortex.cacheAsBitmap = true;
    vortex.position.set(x, y);
    vortex.filters = [new BlurFilter(2, 10, params.resolution)];
  }

  return { container };

  function drawBackground() {
    const r = (theta: number) =>
      abs(tan(theta)) <= params.height / params.width
        ? params.width / (2 * abs(cos(theta)))
        : params.height / (2 * abs(sin(theta)));
    const backgroundContainer = new Container();
    backgroundContainer.addChild(
      renderCanvas((ctx) => {
        const thetaStart = (pi / 4) * random.integer(0, 7);
        const thetaEnd = thetaStart + pi;
        const [rStart, rEnd] = [r(thetaStart), r(thetaEnd)];
        const { x: x0, y: y0 } = fromPolar(rStart, thetaStart);
        const { x: x1, y: y1 } = fromPolar(rEnd, thetaEnd);

        const gradient = ctx.createLinearGradient(
          x0 + params.width / 2,
          -y0 + params.height / 2,
          x1 + params.width / 2,
          -y1 + params.height / 2
        );
        const startColor = random.real(0, 10);
        const endColor = random.real(40, 50);
        gradient.addColorStop(0, `rgb(${startColor} ${startColor} ${startColor})`);
        gradient.addColorStop(1, `rgb(${endColor} ${endColor} ${endColor})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, params.width, params.height);
      }, params)
    );
    backgroundContainer.filters = [new NoiseFilter(random.real(0.125, 0.25), random.realZeroToOneExclusive())];
    return backgroundContainer;
  }

  function drawStars() {
    const container = new Container();
    const numStars = random.real(200, 300);
    for (let i = 0; i < numStars; i++) {
      const g = container.addChild(new Graphics().beginFill("white", random.real(0.5, 1)));
      g.position.set(
        random.real(-params.width / 2, params.width / 2),
        random.real(-params.height / 2, params.height / 2)
      );
      g.drawCircle(0, 0, random.real(2, 4));
    }
    container.filters = [new BlurFilter(1, 1)];
    return container;
  }

  function drawVortex(hue: number) {
    const particleCount = 500;
    const thetaStep = 0.001;
    const maxRadius = random.real(300, 500);
    const minRadius = random.real(20, 50);
    const trailLength = random.real(150, 300);

    const sat = random.real(25, 100);
    const val = random.real(40, 60);
    const valPeriod = (maxRadius - minRadius) * random.real(0.25, 0.5);

    const vortexCoreRadius = maxRadius * random.real(0.25, 0.75);
    const gamma = random.real(0.2, 0.4);
    const c = new Container();
    for (let i = 0; i < particleCount; i++) {
      let r = map(random.realZeroToOneInclusive(), 0, 1, minRadius, maxRadius);
      let theta = random.real(0, 2 * pi);

      const valTheta = map((r - minRadius) % valPeriod, 0, valPeriod, 0, 2 * pi);
      const valOffset = sin(valTheta) * 25;

      const g = c.addChild(new Graphics());
      for (let j = 0; j < trailLength; j++) {
        const rotationalVelocity = (gamma / (2 * pi)) * (r <= vortexCoreRadius ? r / pow(vortexCoreRadius, 2) : 1 / r);
        const rStep = rotationalVelocity / thetaStep;

        const { x: x0, y: y0 } = fromPolar(r, theta);
        const { x: x1, y: y1 } = fromPolar(r + rStep, theta - thetaStep);

        const lineThickness = (1 + n(i * 100, j) + j / trailLength) * 2;
        const alpha = j / (trailLength * 2) + 0.5;
        const hueOffset = (n(i * 10, j / 1000) - 0.5) * 100;
        const color = hsv.hex([(hue + hueOffset + 360) % 360, sat, val + valOffset]);
        g.lineStyle(lineThickness, color, alpha).moveTo(x0, y0).lineTo(x1, y1);

        theta += thetaStep;
        r -= rStep;
      }
    }
    return c;
  }
});
