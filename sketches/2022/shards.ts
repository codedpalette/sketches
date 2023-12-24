import { SketchEnv } from "library/core/types"
import { gray } from "library/drawing/color"
import { drawBackground } from "library/drawing/helpers"
import { map } from "library/utils"
import { Container, DEG_TO_RAD, Graphics } from "pixi.js"
import { BoundingBox, Site, Voronoi } from "voronoijs"

export default ({ random, bbox }: SketchEnv) => {
  const gradientDirection = random.bool()
  const numSites = random.integer(50, 250) // Number of Voronoi site objects
  const sites: Site[] = []
  for (let i = 0; i < numSites; i++) {
    const x = random.minmax(bbox.width / 2)
    const y = random.minmax(bbox.height / 2)
    sites.push({ x, y, id: i })
  }
  const voronoiBBox: BoundingBox = { xl: bbox.xmin, xr: bbox.xmax, yt: bbox.ymin, yb: bbox.ymax }
  const diagram = new Voronoi().compute(sites, voronoiBBox)
  const container = new Container()
  container.addChild(drawBackground(gradientDirection ? "white" : "black", bbox))

  for (const cell of diagram.cells) {
    const halfEdges = cell.halfedges
    const baseScaleFactor = random.real(0.8, 1.2)
    const rotation = random.real(-15, 15) * DEG_TO_RAD
    const offsetVec = random.vec2().multiply(random.realZeroTo(5))

    const subShards = random.integer(75, 125)
    const subShardsContainer = new Container()
    for (let i = 0; i < subShards; i++) {
      const scaleFactor = (baseScaleFactor * (subShards - i)) / subShards
      const alpha = map(i, 0, subShards, 1, 0)
      const fillColor = map(i, 0, subShards, 0, 255)
      const rgb = gray(gradientDirection ? 255 - fillColor : fillColor)

      const pointData = halfEdges.map((edge) => {
        const point = edge.getStartpoint()
        return offsetVec.translate(point.x, point.y).translate(-cell.site.x, -cell.site.y)
      })
      subShardsContainer.addChild(
        new Graphics()
          .lineStyle(0, rgb, alpha)
          .beginFill(rgb, alpha)
          .setTransform(cell.site.x, cell.site.y, scaleFactor, scaleFactor, rotation)
          .drawPolygon(pointData)
      )
    }
    container.addChild(subShardsContainer)
  }
  return { container }
}
