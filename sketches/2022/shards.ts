import { gray, setBackground } from "drawing/pixi";
import { run } from "drawing/sketch";
import { multiply } from "mathjs";
import { Container, DEG_TO_RAD, Graphics } from "pixi.js";
import { map } from "util/map";
import { random } from "util/random";
import { Site, Voronoi } from "voronoijs";

run((params) => {
  const gradientDirection = random.bool();
  const numSites = random.integer(50, 250);
  const sites: Site[] = [];
  for (let i = 0; i < numSites; i++) {
    const x = random.real(-params.width / 2, params.width / 2);
    const y = random.real(-params.height / 2, params.height / 2);
    sites.push({ x, y, id: i });
  }
  const bbox = { xl: -params.width / 2, xr: params.width / 2, yt: -params.height / 2, yb: params.height / 2 };
  const diagram = new Voronoi().compute(sites, bbox);
  const container = new Container();
  setBackground(container, gradientDirection ? "white" : "black", params);

  for (const cell of diagram.cells) {
    const halfEdges = cell.halfedges;
    const baseScaleFactor = random.real(0.8, 1.2);
    const rotation = random.real(-15, 15) * DEG_TO_RAD;
    const offsetVec = multiply(random.random2d(), random.real(0, 5));

    const subShards = random.integer(15, 25);
    for (let i = 0; i < subShards; i++) {
      const scaleFactor = (baseScaleFactor * (subShards - i)) / subShards;
      const alpha = map(i, 0, subShards, 1, 0);
      const fillColor = gradientDirection ? 256 - 24 * i : 16 * i;
      const rgb = gray(fillColor);

      const pointData = halfEdges.map((edge) => {
        const point = edge.getStartpoint();
        const x = point.x + offsetVec[0] - cell.site.x;
        const y = point.y + offsetVec[1] - cell.site.y;
        return { x, y };
      });
      container.addChild(
        new Graphics()
          .lineStyle(0, rgb, alpha)
          .beginFill(rgb, alpha)
          .setTransform(cell.site.x, cell.site.y, scaleFactor, scaleFactor, rotation)
          .drawPolygon(pointData)
      );
    }
  }
  return { container };
});
