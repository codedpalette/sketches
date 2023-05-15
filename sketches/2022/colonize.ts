import { run, Params } from "drawing/sketch";
import { distance, mean, subtract, divide, norm, multiply, add } from "mathjs";
import { Vector2 } from "geometry/vectors";
import { Container, Graphics } from "pixi.js";
import { map } from "util/map";
import { random } from "util/random";

run((params) => {
  const maxDist = (params.width * params.width + params.height * params.height) / 4;
  const influenceDist = 100;
  const segmentLength = 20;
  const killDist = 40;
  const attractorsCount = 1000;

  const mainColor = random.real(0, 360);
  const secondaryColor = (mainColor + 120) % 360;
  const ternaryColor = (mainColor + 240) % 360;

  const container = new Container();
  container.addChild(colonize(mainColor), colonize(secondaryColor), colonize(ternaryColor));
  return { container };

  function colonize(hue: number) {
    let attractors: Vector2[] = [];
    const nodes: Vector2[] = [];

    for (let i = 0; i < attractorsCount; i++) {
      attractors.push([
        random.real(-params.width / 2, params.width / 2),
        random.real(-params.height / 2, params.height / 2),
      ]);
    }
    nodes.push([0, 0]);

    const g = new Graphics();
    while (attractors.length > 0) {
      console.log(`Attractors left: ${attractors.length}`);
      const nodesInfluence = new Map<Vector2, Vector2[]>();

      attractors.forEach((attractor) => {
        const nodesInInfluence = nodes
          .map((node) => ({ node, dist: distance(node, attractor) as number }))
          .filter((e) => e.dist < influenceDist);
        const closestNode =
          nodesInInfluence.length !== 0 && nodesInInfluence.reduce((s, e) => (s.dist < e.dist ? s : e)).node;
        if (closestNode) {
          const oldVal = nodesInfluence.get(closestNode) || [];
          oldVal.push(attractor);
          nodesInfluence.set(closestNode, oldVal);
        }
      });

      const newNodes = nodes
        .filter((node) => nodesInfluence.has(node))
        .map((node) => {
          const nodeAttractors = nodesInfluence.get(node)?.map((vec) => subtract(vec, node)) as Vector2[];
          const avgVec = mean(nodeAttractors, 0) as Vector2;
          const avgVecNorm = add(multiply(divide(avgVec, norm(avgVec)), segmentLength), node);
          drawNode(g, hue, node, avgVecNorm);
          return avgVecNorm;
        });
      nodes.push(...newNodes);

      const prevAttractorsLength = attractors.length;
      attractors = attractors.filter((attractor) => {
        return nodes.map((node) => distance(attractor, node) as number).filter((dist) => dist < killDist).length == 0;
      });
      if (attractors.length == prevAttractorsLength) break;
    }
    return g;
  }

  function drawNode(g: Graphics, hue: number, node: Vector2, avgVec: Vector2) {
    const avgVegMagSquared = avgVec[0] * avgVec[0] + avgVec[1] * avgVec[1];
    const weight = map(avgVegMagSquared, 0, maxDist, 4, 1);
    const alpha = map(avgVegMagSquared, 0, maxDist, 150, 50);
    const bri = map(avgVegMagSquared, 0, maxDist, 70, 30);
    const sat = map(avgVegMagSquared, 0, maxDist, 80, 40);
    const colorSource = { h: hue, s: sat, v: bri, a: alpha };

    g.lineStyle(weight, colorSource)
      .beginFill(colorSource)
      .moveTo(node[0], node[1])
      .lineTo(avgVec[0], avgVec[1])
      .drawCircle(avgVec[0], avgVec[1], weight - 2);
  }
}, Params.DEBUG);
