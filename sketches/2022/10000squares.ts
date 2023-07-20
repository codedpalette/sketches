import { gray } from "drawing/pixi";
import { run } from "drawing/sketch";
import { abs, cos, exp, min, pi, sin } from "mathjs";
import { Container, Graphics } from "pixi.js";
import { map } from "util/map";
import { noise3d, random } from "util/random";

interface LineEq {
  x: number;
  y: number;
  theta: number;
}

//TODO: Rework
// - Noise blending for squares' sizes
// - https://en.wikipedia.org/wiki/Blend_modes

run((params) => {
  const noise = noise3d();
  const randColor = random.real(0, 360);
  const lines: LineEq[] = [];
  for (let i = 0; i < 7; i++) {
    const x = random.real(-params.width / 2, params.width / 2);
    const y = random.real(-params.height / 2, params.height / 2);
    const theta = random.real(0, pi * 2);
    lines.push({ x, y, theta });
  }
  const baseRadius = 40;
  const radiusDiv = 10;

  const rects: Graphics[] = [];
  for (let i = 0; i < 20000; i++) {
    const graphics = new Graphics();

    const [centerX, centerY] = [params.width, params.height].map((n) => random.normal(0, n) / 4);
    const distances = lines.map((line) => distanceToLine(centerX, centerY, line));
    const closest = min(distances);
    const factor = exp(-closest / 75);
    const radius = baseRadius * factor;
    const [width, height] = [random.real(radius, radius + radiusDiv), random.real(radius, radius + radiusDiv)];

    const alpha = map(factor, 1, 0, 255, 150);
    const strokeColor = map(factor, 0, 1, 100, 50);
    const strokeThickness = map(factor * factor, 0, 1, 0, 2);
    graphics.lineStyle(strokeThickness, gray(strokeColor), alpha);

    const hueNoiseFactor = 0.05;
    const n = noise(centerX * hueNoiseFactor, centerY * hueNoiseFactor, 0);
    const hue = n > 0.5 ? randColor : (randColor + 180) % 360;
    const sat = map(factor, 0, 1, 50, 0);
    const val = map(factor, 0, 1, 90, 100);
    graphics.beginFill({ h: hue, s: sat, v: val });

    const skewNoiseFactor = 0.01;
    const n1 = noise(centerX * skewNoiseFactor, centerY * skewNoiseFactor, 1000);
    const n2 = noise(centerX * skewNoiseFactor, centerY * skewNoiseFactor, 2000);
    const [skewX, skewY] = [n1, n2].map((n) => map(n, 0, 1, -pi / 4, pi / 4));
    graphics.skew = { x: skewX, y: skewY };

    graphics.drawRect(width / 2, height / 2, width, height);
    graphics.position = { x: centerX, y: centerY };
    rects.push(graphics);
  }

  const container = new Container();
  container.addChild(...rects);
  return { container };

  function distanceToLine(x: number, y: number, line: LineEq) {
    return abs(cos(line.theta) * (line.y - y) - sin(line.theta) * (line.x - x));
  }
});
