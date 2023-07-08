import { run, getBounds } from "drawing/sketch";
import { Line } from "geometry/paths";
import { pi } from "mathjs";
import { Container, Graphics } from "pixi.js";
import { random } from "util/random";

run((params) => {
  const numBaseLines = 4;
  const bounds = getBounds(params);
  const baseLines = generateBaseLines();

  const container = new Container();
  //const graphics = container.addChild(new Graphics().lineStyle(1, "black"));
  //drawLines(baseLines, graphics);
  container.addChild(drawPolygonsAlongBaselines());
  return { container };

  function generateBaseLines(): Line[] {
    const lines: Line[] = [];
    const sector = (2 * pi) / numBaseLines;
    for (let i = 0; i < numBaseLines; i++) {
      const fromTheta = random.real(i * sector, (i + 1) * sector);
      const fromIdx = (fromTheta / (2 * pi)) * bounds.length;
      const toTheta = fromTheta + random.real(pi / 2, (3 * pi) / 2);
      const toIdx = ((toTheta / (2 * pi)) % 1) * bounds.length;
      const line = new Line(bounds.getPointAt(fromIdx), bounds.getPointAt(toIdx));
      lines.push(line);
    }
    return lines;
  }

  function drawPolygonsAlongBaselines() {
    const container = new Container();
    for (const line of baseLines) {
      const rectSize = random.real(100, 200);
      const step = line.length * random.real(0.01, 0.05);
      for (let i = 0; i < line.length; i += step) {
        const center = line.getPointAt(i);
        container.addChild(
          new Graphics()
            .lineStyle(1, "black")
            .setTransform(center.x, center.y)
            .drawRect(-rectSize / 2, -rectSize / 2, rectSize, rectSize)
        );
      }
    }
    return container;
  }
});
