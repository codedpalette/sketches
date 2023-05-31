import { drawPath, setBackground } from "drawing/pixi";
import { run } from "drawing/sketch";
import { fromPolar } from "geometry/angles";
import { Color, plot } from "geometry/paths";
import { exp, hypot, pi, pow, sqrt } from "mathjs";
import { Container, Graphics, IPointData } from "pixi.js";
import { map } from "util/map";
import { noise2d, random } from "util/random";

run((params) => {
  const noise = noise2d();
  const xBound = 2;
  const scaleFactor = (params.width * 0.5) / xBound;
  const lip = (a: number, b: number, sign: boolean) => (x: number) =>
    (sqrt(a / exp(pow(x * x - b, 2))) as number) * (sign ? 1 : -1);
  const upper = lip(random.real(0.5, 1), random.real(0.5, 1), true);
  const lower = lip(random.real(0.5, 1), random.real(0, 0.5), false);

  const backHue = random.real(0, 360);
  const background = { h: backHue, s: random.real(10, 30), v: random.real(70, 90) }; //TODO: paper texture
  const container = new Container();
  setBackground(container, background, params);

  for (let i = 0; i < 10; i++) {
    const [x, y] = [
      random.real(-params.width / 4, params.width / 4),
      random.real(-params.height / 4, params.height / 4),
    ];
    const boundsDiagonal = hypot(params.width, params.height);
    const radius = random.real(boundsDiagonal * 0.25, boundsDiagonal * 0.5);
    const color = { h: backHue, s: random.real(10, 30), v: random.real(70, 90), a: random.real(0.3, 0.7) };
    const numVertices = random.integer(5, 15);
    container.addChild(new Graphics().beginFill(color).drawPolygon(randomPolygon(numVertices, radius, { x, y })));
  }

  //TODO: Plot graphs and axes

  const numPolygons = 3000;
  for (let i = 0; i < numPolygons; i++) {
    const [x, y] = [random.real(-xBound, xBound), random.real(-xBound / 2, xBound / 2)];
    if (y > upper(x) || y < lower(x)) {
      i--;
      continue;
    }
    const yNorm = y / (y > 0 ? upper(x) : lower(x));
    const n = noise(x, y);
    const center = { x: x * scaleFactor, y: y * scaleFactor };
    const radius = map(pow(yNorm, 1 / 3), 0, 1, 15, 30);
    const sat = map(n, 0, 1, 90, 100);
    const val = map(pow(yNorm, 1 / 2), 0, 1, 50, 100);
    const alpha = random.real(0.5, 1);
    const color = { h: 0, s: sat, v: val, a: alpha };
    const numVertices = random.integer(3, 9);
    container.addChild(new Graphics().beginFill(color).drawPolygon(randomPolygon(numVertices, radius, center)));
  }

  const lips = [upper, lower].map((f) => plot(f, -xBound, xBound));
  lips.forEach((graph) => {
    graph.scale(scaleFactor, [0, 0]);
    graph.strokeWidth = 5;
    graph.dashArray = Array.from({ length: random.integer(3, 7) }, (_) => random.integer(10, 40));
    graph.strokeColor = new Color("hsl(0deg, 100%, 30%");
    const graphics = drawPath(graph);
    graphics.alpha = 0.5;
    //container.addChild(graphics);
  });

  function randomPolygon(numVertices: number, radius: number, center: IPointData): IPointData[] {
    const thetas = Array.from({ length: numVertices }, (_) => random.real(0, 2 * pi)).sort();
    return thetas.map((theta) => {
      const { x, y } = fromPolar(radius, theta);
      return { x: x + center.x, y: y + center.y };
    });
  }
  return { container };
});
