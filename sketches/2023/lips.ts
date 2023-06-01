import { drawPath, setBackground } from "drawing/pixi";
import { run } from "drawing/sketch";
import { fromPolar } from "geometry/angles";
import { Color, plot } from "geometry/paths";
import { abs, exp, hypot, pi, pow, sqrt } from "mathjs";
import { Container, Graphics, IPointData, NoiseFilter } from "pixi.js";
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
  const backColor = { h: backHue, s: random.real(10, 30), v: random.real(70, 90) }; //TODO: paper texture - https://www.youtube.com/watch?v=MEYdsoZua7E
  const backContainer = new Container();
  setBackground(backContainer, backColor, params);

  for (let i = 0; i < 10; i++) {
    const [x, y] = [
      random.real(-params.width / 4, params.width / 4),
      random.real(-params.height / 4, params.height / 4),
    ];
    const boundsDiagonal = hypot(params.width, params.height);
    const radius = random.real(boundsDiagonal * 0.25, boundsDiagonal * 0.5);
    const color = { h: backHue, s: random.real(10, 30), v: random.real(70, 90), a: random.real(0.3, 0.7) };
    const numVertices = random.integer(5, 15);
    backContainer.addChild(new Graphics().beginFill(color).drawPolygon(randomPolygon(numVertices, radius, { x, y })));
  }

  backContainer.filters = [new NoiseFilter(random.real(0.1, 0.5))];
  const container = new Container();
  container.addChild(backContainer);

  //TODO: Plot graphs and axes

  const numPolygons = 3000;
  for (let i = 0; i < numPolygons; i++) {
    const [x, y] = [random.real(-xBound, xBound), random.real(-xBound / 2, xBound / 2)];
    if (y > upper(x) || y < lower(x)) {
      i--;
      continue;
    }
    const yNorm = y / (y > 0 ? upper(x) : lower(x));
    const n = noise(x * scaleFactor, y * scaleFactor);
    const center = { x: x * scaleFactor, y: y * scaleFactor };
    const radius = map(pow(yNorm, 1 / 3), 0, 1, 15, 30);
    const color = {
      h: 0,
      s: map(n, 0, 1, 80, 100),
      v: map(abs(yNorm - 0.5) * 2, 0, 1, 100, 50),
      a: random.real(0.5, 1),
    };
    const numVertices = random.integer(3, 9);
    container.addChild(
      new Graphics()
        .beginFill(color)
        .lineStyle(random.real(0.3, 0.7), "black", random.real(0, 0.5))
        .drawPolygon(randomPolygon(numVertices, radius, center))
    );
  }

  const lips = [upper, lower].map((f) => plot(f, -xBound, xBound));
  lips.forEach((graph) => {
    graph.scale(scaleFactor, [0, 0]);
    graph.strokeWidth = 3;
    graph.dashArray = Array.from({ length: random.integer(3, 7) }, (_) => random.integer(10, 40));
    graph.strokeColor = new Color("black");
    const graphics = drawPath(graph);
    graphics.alpha = 0.5;
    params.debug && container.addChild(graphics);
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
