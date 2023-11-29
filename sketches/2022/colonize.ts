import { Point, point } from "@flatten-js/core"
import { run, SketchFactory } from "core/sketch"
import { drawBackground } from "drawing/helpers"
import { Container, Graphics } from "pixi.js"

const sketch: SketchFactory = ({ random, bbox }) => {
  // Only nodes within this distance around an attractor can be associated with that attractor.
  // Large attraction distances mean smoother and more subtle branch curves, but at a performance cost.
  const attractionDist = 100
  // The distance between nodes as the network grows.
  // Larger values mean better performance, but choppier and sharper branch curves.
  const segmentLength = 20
  // An attractor may be removed if one or more nodes are within this distance around it.
  const killDist = 40
  const attractorsCount = 1000

  const container = new Container()
  container.addChild(drawBackground("white", bbox))
  container
    .addChild(new Graphics())
    .beginFill(random.color())
    .drawRect(-bbox.width / 4, -bbox.height / 4, bbox.width / 2, bbox.height / 2)
  return { container }

  function colonize(hue: number) {
    // Focal points of some resource that promote growth
    const attractors: Point[] = []
    // Points through which lines are drawn to render branches
    const nodes: Point[] = []

    // Place random attractors
    for (let i = 0; i < attractorsCount; i++) {
      const attractor = point(random.minmax(bbox.width / 2), random.minmax(bbox.height / 2))
      attractors.push(attractor)
    }
    nodes.push(point(0, 0))
  }
}

run(sketch)
