import { gray, setBackground } from "drawing/pixi";
import { run } from "drawing/sketch";
import { cos, distance, min, pi, sin } from "mathjs";
import { Container, Graphics, IPointData } from "pixi.js";
import { map } from "util/map";
import { random } from "util/random";

interface Circle {
  center: [number, number];
  radius: number;
}
run((params) => {
  const backgroundColor = random.real(0, 20);
  const minVal = (backgroundColor / 255) * 100;
  const mainHue = random.real(0, 360);
  const secondHue = (mainHue + 180) % 360;
  const container = new Container();
  setBackground(container, gray(backgroundColor), params);

  const circles: Circle[] = [];
  const minRadius = 30;
  const maxRadius = 150;
  const totalCircles = 1000;
  const createCircleAttempts = 100;

  for (let i = 0; i < totalCircles; i++) {
    createCircle();
  }
  return { container };

  function createCircle() {
    let newCircle: Circle | undefined;
    let circleSafeToDraw = false;
    for (let tries = 0; tries < createCircleAttempts; tries++) {
      newCircle = {
        center: [random.real(-params.width / 2, params.width / 2), random.real(-params.height / 2, params.height / 2)],
        radius: minRadius,
      };
      if (isCircleCollides(newCircle)) {
        continue;
      } else {
        circleSafeToDraw = true;
        break;
      }
    }

    if (!circleSafeToDraw || !newCircle) return;
    for (let radius = minRadius; radius < maxRadius; radius++) {
      newCircle.radius = radius;
      if (isCircleCollides(newCircle)) {
        newCircle.radius--;
        break;
      }
    }

    circles.push(newCircle);
    drawCircle(newCircle);
  }

  function isCircleCollides(circle: Circle) {
    const x = circle.center[0];
    const y = circle.center[1];
    if (x + circle.radius >= params.width / 2 || x - circle.radius <= -params.width / 2) return true;
    if (y + circle.radius >= params.height / 2 || y - circle.radius <= -params.height / 2) return true;
    for (const otherCircle of circles) {
      if (circle.radius + otherCircle.radius >= (distance(circle.center, otherCircle.center) as number)) return true;
    }
    return false;
  }

  function drawCircle(circle: Circle) {
    const noiseAmp = random.real(3, min(minRadius, circle.radius));
    const thetaStep = random.real(3, 10) / 100;
    const hue = random.bool() ? mainHue : secondHue;
    const radius = circle.radius - noiseAmp / 2;
    const graphics = new Graphics();
    for (let i = radius; i > 0; i -= noiseAmp / 2) {
      const val = map(i, radius, 0, minVal, 100);
      const sat = i == radius ? 0 : map(i, radius, 0, 100, 20);
      graphics.beginFill({ h: hue, s: sat, v: val });

      const points: IPointData[] = [];
      for (let theta = 0; theta < 2 * pi; theta += thetaStep) {
        const r = i + random.real(-0.2, 0.2) * noiseAmp;
        const x = circle.center[0] + r * cos(theta);
        const y = circle.center[1] + r * sin(theta);
        points.push({ x, y });
      }
      graphics.drawPolygon(points).closePath();
      container.addChild(graphics);
    }
  }
});
