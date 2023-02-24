import { init, run } from "drawing/sketch";
import { Line } from "geometry/paths";
import { Container, Graphics, NoiseFilter } from "pixi.js";
import { random } from "util/random";
import { hsl } from "color-convert";
import { min, sqrt } from "mathjs";
import { createNoise2D } from "simplex-noise";

type Direction = "diag_up" | "diag_down"; //TODO: Not only diagonal

const hue = random.real(0, 360);
const bgColor = hsl.hex([hue, random.real(20, 30), random.real(80, 90)]);
const params = init();

function drawLines(dir: Direction, lineStep: number) {
  const g = new Graphics();
  const line =
    dir == "diag_up"
      ? new Line([-params.width, -params.height], [params.width, params.height])
      : new Line([-params.width, params.height], [params.width, -params.height]);

  drawLine(line, g, dir);
  for (let i = lineStep; i < params.height; i += lineStep) {
    const lineCopy = line.clone();
    lineCopy.translate([0, i]);
    drawLine(lineCopy, g, dir);
    lineCopy.translate([0, -2 * i]);
    drawLine(lineCopy, g, dir);
  }
  return g;
}

function drawLine(line: Line, g: Graphics, dir: Direction) {
  const step = random.real(0.001, 0.0015);
  const startPoint = line.getPointAt(0);
  const lineColor = parseInt(hsl.hex([(hue + 180) % 360, 100, 10]), 16);
  g.moveTo(startPoint.x, startPoint.y);
  for (let i = step; i < 1; i += step) {
    const alpha = random.real(0.6, 1);
    const point = line.getPointAt(i * line.length);
    const offset = random.real(-0.5, 0.5) * (sqrt(2) as number);
    g.lineStyle(random.real(2, 3), lineColor, alpha).lineTo(
      point.x + offset * (dir == "diag_up" ? -1 : 1),
      point.y + offset
    );
  }
}

function drawMask() {
  const noise = createNoise2D();
  const gridStep = 500;
  const noiseFactor = random.real(0.003, 0.007);
  const size = min(params.width, params.height);
  const step = size / gridStep;
  const mask = new Graphics().beginFill(0xffffff);
  for (let x = -params.width / 2; x < params.width / 2; x += step) {
    for (let y = -params.height / 2; y < params.height / 2; y += step) {
      const n = noise((x + step / 2) * noiseFactor, (y + step / 2) * noiseFactor);
      n > 0.25 && mask.drawRect(x, y, step, step);
    }
  }
  mask.endFill();
  return mask;
}

const lineStep = random.integer(5, 10);
function drawLayer(dir: Direction) {
  const container = new Container();
  const mask = drawMask();
  container.mask = mask;
  container.addChild(mask);
  container.addChild(drawLines(dir, lineStep));
  return container;
}

const container = new Container();
const background = new Graphics()
  .beginFill(parseInt(bgColor, 16))
  .drawRect(-params.width / 2, -params.height / 2, params.width, params.height);
background.filters = [new NoiseFilter(random.real(0.1, 0.2))];

container.addChild(background);
container.addChild(drawLayer("diag_up"));
container.addChild(drawLayer("diag_down"));
run({ container }, params);
