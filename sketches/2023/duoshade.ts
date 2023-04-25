import { SketchParams, run } from "drawing/sketch";
import { Line } from "geometry/paths";
import { Container, Graphics, NoiseFilter } from "pixi.js";
import { random } from "util/random";
import { hsl } from "color-convert";
import { min, sqrt } from "mathjs";
import { createNoise2D } from "simplex-noise";

void run((params) => {
  const hue = random.real(0, 360);
  const bgColor = hsl.hex([hue, random.real(20, 30), random.real(80, 90)]);
  const numLayers = random.integer(2, 5);
  const startingRotation = random.real(0, 360);
  const maskGridStep = 500;

  const container = new Container();

  const background = new Graphics()
    .beginFill(parseInt(bgColor, 16))
    .drawRect(-params.width / 2, -params.height / 2, params.width, params.height);
  background.filters = [new NoiseFilter(random.real(0.1, 0.2))];
  container.addChild(background);

  for (let i = 0; i < numLayers; i++) {
    const layerRotation = startingRotation + i * ((180 / numLayers) * random.real(0.8, 1.2));
    container.addChild(drawLayer(layerRotation, params));
  }

  return { container };

  function drawLayer(rotation: number, params: SketchParams) {
    const container = new Container();

    const noiseFactor = random.real(0.001, 0.01);
    const cutoff = random.real(0.25, 0.5);
    const mask = drawMask(noiseFactor, cutoff, params);
    container.mask = mask;
    container.addChild(mask);

    const lineStep = random.real(5, 15);
    const sat = random.real(50, 100);
    const bri = random.real(10, 30);
    const lines = drawLines(lineStep, sat, bri, params);
    lines.angle = rotation;
    container.addChild(lines);

    return container;
  }

  function drawMask(noiseFactor: number, cutoff: number, params: SketchParams) {
    const noise = createNoise2D();
    const size = min(params.width, params.height);
    const step = size / maskGridStep;
    const mask = new Graphics().beginFill(0xffffff);
    for (let x = -params.width / 2; x < params.width / 2; x += step) {
      for (let y = -params.height / 2; y < params.height / 2; y += step) {
        const n = noise((x + step / 2) * noiseFactor, (y + step / 2) * noiseFactor);
        n > cutoff && mask.drawRect(x, y, step, step);
      }
    }
    mask.endFill();
    return mask;
  }

  function drawLines(lineStep: number, sat: number, bri: number, params: SketchParams) {
    const g = new Graphics();
    const line = new Line([-params.width, -params.height], [params.width, params.height]);

    drawLine(line, g, sat, bri, lineStep);
    for (let i = lineStep; i < params.height; i += lineStep) {
      const lineCopy = line.clone();
      lineCopy.translate([0, i]);
      drawLine(lineCopy, g, sat, bri, lineStep);
      lineCopy.translate([0, -2 * i]);
      drawLine(lineCopy, g, sat, bri, lineStep);
    }
    return g;
  }

  function drawLine(line: Line, g: Graphics, sat: number, bri: number, lineStep: number) {
    const step = random.real(0.001, 0.0015);
    const startPoint = line.getPointAt(0);
    const lineColor = parseInt(hsl.hex([(hue + 180) % 360, sat, bri]), 16);
    g.moveTo(startPoint.x, startPoint.y);
    for (let i = step; i < 1; i += step) {
      const alpha = random.real(0.6, 1);
      const point = line.getPointAt(i * line.length);
      const offset = random.real(-0.5, 0.5) * (sqrt(2) as number);
      g.lineStyle(random.real(2, 2 + lineStep / 5), lineColor, alpha).lineTo(point.x - offset, point.y + offset);
    }
  }
});
