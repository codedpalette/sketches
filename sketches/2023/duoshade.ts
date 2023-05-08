import { SketchParams, run } from "drawing/sketch";
import { Line, Point } from "geometry/paths";
import { Container, Graphics, NoiseFilter, Sprite } from "pixi.js";
import { noise3d, random } from "util/random";
import { hsl } from "color-convert";
import { sqrt } from "mathjs";

run((params) => {
  const hue = random.real(0, 360);
  const bgColor = hsl.hex([hue, random.real(20, 30), random.real(80, 90)]);
  const numLayers = random.integer(2, 4);
  const startingRotation = random.real(0, 360);

  const container = new Container();

  const background = new Graphics()
    .beginFill(parseInt(bgColor, 16))
    .drawRect(-params.width / 2, -params.height / 2, params.width, params.height);
  background.filters = [new NoiseFilter(random.real(0.1, 0.2))];
  container.addChild(background);

  for (let i = 0; i < numLayers; i++) {
    const layerRotation = startingRotation + i * ((180 / numLayers) * random.real(0.8, 1.2));
    container.addChild(drawLayer(i, layerRotation, params));
  }

  return { container };

  function drawLayer(layerNum: number, rotation: number, params: SketchParams) {
    const container = new Container();

    const noiseFactor = random.real(0.001, 0.01);
    const cutoff = random.real(0.25, 0.5);
    const mask = drawMask(layerNum, noiseFactor, cutoff, params);
    container.mask = mask;
    container.addChild(mask);

    const lineStep = random.real(10, 20);
    const sat = random.real(50, 100);
    const bri = random.real(10, 30);
    const lines = drawLines(lineStep, sat, bri, params);
    lines.angle = rotation;
    container.addChild(lines);

    return container;
  }

  function drawMask(layerNum: number, noiseFactor: number, cutoff: number, params: SketchParams) {
    const canvas = new OffscreenCanvas(params.width, params.height);
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
    const imageData = ctx.getImageData(0, 0, params.width, params.height);
    const pixels = imageData.data;
    let i = 0;
    for (let x = 0; x < params.width; x++) {
      for (let y = 0; y < params.height; y++) {
        const n = noise3d(x * noiseFactor, y * noiseFactor, layerNum * 1000);
        pixels[i++] = pixels[i++] = pixels[i++] = n > cutoff ? 255 : 0;
        pixels[i++] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const sprite = Sprite.from(canvas);
    sprite.anchor.set(0.5, 0.5);
    return sprite;
  }

  function drawLines(lineStep: number, sat: number, bri: number, params: SketchParams) {
    const c = new Container();
    const line = new Line([-params.width, -params.height], [params.width, params.height]);
    const lineColor = parseInt(hsl.hex([(hue + 180) % 360, sat, bri]), 16);

    c.addChild(drawLine(line, lineColor, lineStep));
    for (let i = lineStep; i < params.height; i += lineStep) {
      line.position = new Point(0, i);
      c.addChild(drawLine(line, lineColor, lineStep));
      line.position = new Point(0, -i);
      c.addChild(drawLine(line, lineColor, lineStep));
    }
    c.cacheAsBitmap = true;
    return c;
  }

  function drawLine(line: Line, lineColor: number, lineStep: number) {
    const g = new Graphics();
    const step = random.real(0.001, 0.003);
    const startPoint = line.getPointAt(0);
    g.moveTo(startPoint.x, startPoint.y);
    for (let i = step; i < 1; i += step) {
      const alpha = random.real(0.6, 1);
      const point = line.getPointAt(i * line.length);
      const offset = random.real(-0.5, 0.5) * (sqrt(2) as number);
      g.lineStyle(random.real(2, 2 + lineStep / 5), lineColor, alpha).lineTo(point.x - offset, point.y + offset);
    }
    return g;
  }
});
