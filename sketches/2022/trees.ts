import { gray, setBackground } from "drawing/pixi"
import { run } from "drawing/sketch"
import { pi } from "mathjs"
import { BlurFilter, Color, ColorMatrixFilter, ColorSource, Container, Graphics } from "pixi.js"
import { map } from "utils/map"
import { noise2d, random } from "utils/random"

//TODO: Redraw
// - bright background
// - one tree per layer
// - less grass
// add leaves and fruits

run((params) => {
  const noise = noise2d()
  const maxDepth = 4
  const stopBranchHeight = 10
  const landHeight = 100
  const landAmp = 20
  const numLayers = 7
  const container = new Container()
  setBackground(container, "white", params)

  for (let i = 0; i < numLayers; i++) {
    const layerContainer = new Container()
    const y = (numLayers - i - 1) * (landHeight - landAmp)
    layerContainer.position.set(0, y)
    const color = gray(map(i, 0, numLayers - 1, 128, 0))
    layerContainer.addChild(trees(color))
    layerContainer.addChild(landscape(i, color))
    layerContainer.filters = i == numLayers - 1 ? null : [new BlurFilter(numLayers - i - 1)]
    container.addChild(layerContainer)
  }

  const tintFilter = new ColorMatrixFilter()
  container.filters = [tintFilter]
  tintFilter.tint(new Color({ h: random.real(0, 360), s: random.real(30, 50), v: random.real(70, 90) }).toNumber())
  return { container }

  function landscape(noiseOffset: number, color: ColorSource) {
    const g = new Graphics().lineStyle(1, color).beginFill(color)
    const pointData = [{ x: -params.width / 2, y: -params.height / 2 }]
    for (let i = 0; i < params.width; i++) {
      const n = noise(i, noiseOffset * 1000)
      const delta = map(n, 0, 1, -landAmp, landAmp)
      pointData.push({ x: i - params.width / 2, y: -params.height / 2 + landHeight - delta })
    }
    pointData.push({ x: params.width / 2, y: -params.height / 2 })
    g.drawPolygon(pointData)
    g.closePath()
    return g
  }

  function trees(color: ColorSource) {
    const container = new Container()
    const numTrees = random.integer(3, 7)
    const w = params.width / numTrees
    for (let i = 0; i < numTrees; i++) {
      const x = (i / numTrees) * params.width + random.real(0.25, 0.75) * w - params.width / 2
      const y = -params.height / 2 + random.real(0, landHeight - landAmp)
      container.addChild(tree(x, y, random.real(80, 120), color))
    }
    return container
  }

  function tree(x: number, y: number, startBranchHeight: number, color: ColorSource) {
    const container = new Container()
    container.position.set(x, y)
    container.addChild(branch(startBranchHeight, 0, startBranchHeight, color))
    return container
  }

  function branch(height: number, depth: number, startBranchHeight: number, color: ColorSource) {
    if (depth > maxDepth) return new Graphics().beginFill("white").drawCircle(0, 0, random.real(1, 2))
    const container = new Container()
    const width = map(height, stopBranchHeight, startBranchHeight, 1, 5)
    const alpha = map(height, stopBranchHeight, startBranchHeight, 32, 255) / 255
    container.addChild(new Graphics().lineStyle({ width, color, alpha }).lineTo(0, height))

    const maxTheta = depth == 0 ? pi / 4 : pi / 6
    const nBranches = depth == 0 ? random.integer(4, 8) : random.integer(2, 6)
    for (let i = 0; i < nBranches; i++) {
      const theta = random.real(-maxTheta, maxTheta)
      const newHeight = height * random.real(0.5, 0.9)
      if (newHeight > stopBranchHeight) {
        const branchContainer = branch(newHeight, depth + 1, startBranchHeight, color)
        if (branchContainer) {
          branchContainer.rotation = theta
          branchContainer.position.set(0, height)
          container.addChild(branchContainer)
        }
      }
    }
    return container
  }
})
