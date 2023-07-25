import { gray, setBackground } from "drawing/pixi";
import { run } from "drawing/sketch";
import { Vector2 } from "geometry/vectors";
import { DashLine } from "pixi-dashed-line";
import { Color, Container, Graphics } from "pixi.js";
import { random } from "util/random";

run((params) => {
  const numPoints = random.integer(40, 60);
  const points: Vector2[] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = random.real(-params.width / 2, params.width / 2);
    const y = random.real(-params.height / 2, params.height / 2);
    points.push([x, y]);
  }

  const g = new Graphics();
  for (let i = 0; i < numPoints; i++) {
    for (let j = 0; j < numPoints; j++) {
      if (i == j) continue;
      const color = new Color(gray(random.real(0, 100)));
      const dash = new DashLine(g, {
        dash: [random.real(10, 20), random.real(2, 10)],
        width: random.real(0.2, 0.4),
        color: color.toNumber(),
        alpha: 0.5,
        useDots: false,
      });
      dash.moveTo(points[i][0], points[i][1]).lineTo(points[j][0], points[j][1]);
    }
  }

  const container = new Container();
  setBackground(container, "white", params);
  container.addChild(g);
  return { container };
});
