import { setBackground } from "drawing/pixi";
import { run } from "drawing/sketch";
import { pi, pow } from "mathjs";
import { Container, Graphics } from "pixi.js";
import { map } from "util/map";
import { noise2d, random } from "util/random";

//TODO: rework

run((params) => {
  const noise = noise2d();
  const hue = random.real(0, 360);
  const numWaves = random.integer(15, 25);
  const baseWaveAmp = params.height / numWaves;
  const container = new Container();
  setBackground(container, "black", params);

  for (let i = 0; i < numWaves; i++) {
    const yWave = params.height / 2 - (params.height * i) / numWaves;
    const yNext = params.height / 2 - (params.height * (i + 1)) / numWaves;
    const waveAmp = baseWaveAmp * random.real(0.8, 1.2);
    fillWave(yWave, yNext, i, waveAmp);
  }
  return { container };

  function fillWave(yWave: number, yNext: number, waveNum: number, waveAmp: number) {
    const skewAbs = random.real(pi / 16, pi / 4);
    const rectSize = random.real(10, 20);
    const [xStart, xStep, skew] = random.bool()
      ? [params.width / 2, -rectSize, skewAbs]
      : [-params.width / 2, rectSize, -skewAbs];

    let x = xStart;
    let y = -params.height / 2;
    let shouldOffset = true;

    const noiseFactor = 0.001;
    while (x >= -params.width / 2 - rectSize * 2 && x <= params.width / 2 + rectSize * 2) {
      const yStop = yWave - map(noise(x * noiseFactor, 1000 * waveNum), 0, 1, -waveAmp / 2, waveAmp / 2);
      const yNorm = 1 - (y - yStop) / (yNext - yStop);
      const sat = map(noise(x * noiseFactor, y * noiseFactor), 0, 1, 50, 100);
      const val = map(pow(yNorm, 3), 0, 1, 0, 100);
      const color = { h: hue, s: sat, v: val };

      if (val > 10) {
        const g = new Graphics().beginFill(color);
        g.position.set(x, y);
        g.skew.x = skew;
        g.drawRect(rectSize / 2, rectSize / 2, rectSize, rectSize);
        container.addChild(g);
      }

      y += rectSize / 2;
      if (y >= yStop) {
        x += xStep;
        y = shouldOffset ? -params.height / 2 + rectSize / 4 : -params.height / 2;
        shouldOffset = !shouldOffset;
      }
    }
  }
});
