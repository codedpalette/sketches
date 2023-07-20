import { gray, setBackground } from "drawing/pixi";
import { run } from "drawing/sketch";
import { pi, sin } from "mathjs";
import { Container, Graphics } from "pixi.js";
import { map } from "util/map";
import { random } from "util/random";

//TODO: smoother size increases

run((params) => {
  const isDarkBackground = random.bool();
  let alphaStep = random.real(2, 10);
  let alpha = 0;

  const container = new Container();
  setBackground(container, gray(isDarkBackground ? 20 : 240), params);

  const tStep = 0.0003;
  const a = random.integer(1, 10) * 2 - 1;
  const b = random.integer(1, 10) * 2;
  const delta = random.real(-pi / 2, pi / 2);
  const A = params.width / 2 - 20;
  const B = params.height / 2 - 20;

  const g = new Graphics();
  let t = 0;
  while (t < 2 * pi) {
    const x = A * sin(a * t + delta);
    const y = B * sin(b * t);
    const rad = map(alpha, 0, 255, 1, 5);
    const color = gray(isDarkBackground ? alpha : 255 - alpha);
    g.beginFill(color, alpha / 255)
      .drawCircle(x, y, rad)
      .endFill();
    t += tStep;
    alpha += alphaStep;
    if (alpha > 255) {
      alpha = 0;
      alphaStep = random.real(2, 10);
      t += tStep * random.real(30, 60);
    }
  }

  container.addChild(g);
  return { container };
});
