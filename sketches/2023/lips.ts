import { drawPath } from "drawing/pixi";
import { run, Params } from "drawing/sketch";
import { Color, plot } from "geometry/paths";
import { exp, pow, sqrt } from "mathjs";
import { Container } from "pixi.js";
import { random } from "util/random";

run((params) => {
  const xBound = 2;
  const lip = (a: number, b: number, sign: boolean) => (x: number) =>
    (sqrt(a / exp(pow(x * x - b, 2))) as number) * (sign ? 1 : -1);
  const upper = lip(random.real(0.5, 1), random.real(0.5, 1), true);
  const lower = lip(random.real(0.5, 1), random.real(0, 0.5), false);
  const lips = [upper, lower].map((f) => plot(f, -xBound, xBound));

  const container = new Container();
  lips.forEach((graph) => {
    graph.scale((params.width * 0.5) / xBound, [0, 0]);
    graph.strokeColor = new Color("black");
    container.addChild(drawPath(graph));
  });
  return { container };
}, Params.DEBUG);
