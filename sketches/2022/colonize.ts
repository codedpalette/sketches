import { box, PlanarSet, Point, point, vector } from "@flatten-js/core"
import { run, SketchFactory } from "core/sketch"
import { gray } from "drawing/color"
import { drawBackground } from "drawing/helpers"
import { Container, Graphics } from "pixi.js"
import { map } from "utils"

const sketch: SketchFactory = ({ random, bbox }) => {
  const maxDist = (bbox.width * bbox.width + bbox.height * bbox.height) / 4
  // Only nodes within this distance around an attractor can be associated with that attractor.
  // Large attraction distances mean smoother and more subtle branch curves, but at a performance cost.
  const attractionDist = 100 // TODO: Increase after optimization
  // The distance between nodes as the network grows.
  // Larger values mean better performance, but choppier and sharper branch curves.
  const segmentLength = 20
  // An attractor may be removed if one or more nodes are within this distance around it.
  const killDist = 50
  const attractorsCount = 1000
  const mainHue = random.realZeroTo(360)

  const container = new Container()
  container.addChild(
    drawBackground(random.bool() ? gray(random.realZeroTo(20)) : gray(255 - random.realZeroTo(20)), bbox)
  )
  for (let i = 0; i < 3; i++) {
    container.addChild(colonize((mainHue + 120 * i) % 360))
  }
  return { container }

  function colonize(hue: number) {
    // Focal points of some resource that promote growth
    // Spatial index for faster lookup
    const attractors = new PlanarSet()
    // Points through which lines are drawn to render branches
    const nodes: Point[] = []

    const g = new Graphics().beginFill("black")

    // Place random attractors
    for (let i = 0; i < attractorsCount; i++) {
      const attractor = point(random.minmax(bbox.width / 2), random.minmax(bbox.height / 2))
      //g.drawCircle(attractor.x, attractor.y, 1)
      attractors.add(attractor)
    }
    nodes.push(point(0, 0))

    while (attractors.size > 0) {
      console.log(`Attractors left: ${attractors.size}`)
      const newNodes: Point[] = []

      // Associate nodes with nearby attractors to figure out where growth should occur
      for (const node of nodes) {
        const nodeAttractors = findAttractorsInRadius(node, attractors, attractionDist)
        if (nodeAttractors.length > 0) {
          const attractionVectors = nodeAttractors.map((attractor) => vector(node, attractor))
          const averageVector = attractionVectors
            .reduce((a, b) => a.add(b))
            .multiply(1 / attractionVectors.length)
            .normalize()
          // Add small amount of random "jitter" to avoid getting stuck
          // between two attractors and endlessly generating nodes in the same place
          const segmentVector = averageVector.add(random.vec2(-1, 1)).multiply(segmentLength)
          const newNode = node.translate(segmentVector)
          drawNode(g, hue, node, newNode)
          newNodes.push(newNode)
        }
      }
      nodes.push(...newNodes)

      // Prune attractors when branches get too close.
      const prevAttractorsSize = attractors.size
      for (const node of newNodes) {
        const reachedAttractors = findAttractorsInRadius(node, attractors, killDist)
        reachedAttractors.forEach((attractor) => attractors.delete(attractor))
      }
      if (attractors.size < attractorsCount / 10 && attractors.size == prevAttractorsSize) break
    }
    return g
  }

  function findAttractorsInRadius(node: Point, attractorIndex: PlanarSet, radius: number): Point[] {
    // TODO: Try RBush
    const searchBox = box(node.x - radius, node.y - radius, node.x + radius, node.y + radius)
    const attractorsInBox = attractorIndex.search(searchBox) as Point[]
    return attractorsInBox.filter((attractor) => attractor.distanceTo(node)[0] <= radius)
  }

  function drawNode(g: Graphics, hue: number, node: Point, newNode: Point) {
    // TODO: Vein thickening and opacity blending
    const avgVegMagSquared = newNode.x * newNode.x + newNode.y * newNode.y
    const weight = map(avgVegMagSquared, 0, maxDist, 3, 1)
    const alpha = map(avgVegMagSquared, 0, maxDist, 100, 20)
    const bri = map(avgVegMagSquared, 0, maxDist, 70, 30)
    const sat = map(avgVegMagSquared, 0, maxDist, 80, 40)
    const colorSource = { h: hue, s: sat, v: bri, a: alpha }

    g.lineStyle(weight, colorSource).beginFill(colorSource).moveTo(node.x, node.y).lineTo(newNode.x, newNode.y)
    //.drawCircle(newNode.x, newNode.y, weight - 2)
  }
}

run(sketch)
