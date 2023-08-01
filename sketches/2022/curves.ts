import { gray, setBackground } from "drawing/pixi"
import { run } from "drawing/sketch"
import { Point } from "geometry/paths"
import { cos, pi, sin } from "mathjs"
import { ColorSource, Container, Graphics, RAD_TO_DEG } from "pixi.js"
import { map } from "utils/map"
import { noise2d, random } from "utils/random"

//TODO: Rework, optimize
// - less blank space

run((params) => {
  const noise = noise2d()
  const numCurves = 2000
  const flowFieldResolution = 100
  const noiseFactor = 0.01
  const flowField: number[][] = []
  const cellVisited: boolean[][] = []
  const palette = generatePalette()
  const container = new Container()
  setBackground(container, gray(random.real(0, 30)), params)

  for (let i = -flowFieldResolution * 2; i < flowFieldResolution * 2; i++) {
    flowField[i] = []
    cellVisited[i] = []
    for (let j = -flowFieldResolution * 2; j < flowFieldResolution * 2; j++) {
      const n = noise(i * noiseFactor, j * noiseFactor)
      const rotation = map(n, 0, 1, 0, 2 * pi)
      flowField[i][j] = rotation
      cellVisited[i][j] = false
    }
  }

  for (let i = 0; i < numCurves; i++) {
    const x = random.real(-params.width / 2, params.width / 2)
    const y = random.real(-params.height / 2, params.height / 2)
    drawCurve(x, y, i / numCurves)
  }

  return { container }

  function drawCurve(x: number, y: number, fillPercent: number) {
    const { points = [], oppositePoints = [], visitedCells = [] } = generatePoints(x, y, fillPercent)
    if (points.length == 0) {
      console.log("Empty")
      return
    }
    for (const visitedCell of visitedCells) {
      cellVisited[visitedCell.i][visitedCell.j] = true
    }

    const randomColor = random.pick(palette)
    const pointData = points
      .concat(oppositePoints)
      .map((p) => p.toVec())
      .flat()
    const g = new Graphics().beginFill(randomColor).drawPolygon(pointData).closePath()
    container.addChild(g)
  }

  function generatePoints(startX: number, startY: number, fillPercent: number) {
    let x = startX,
      y = startY
    const stepLength = params.width / 1000
    const numPoints = random.real(500, 1000)
    const points = [],
      oppositePoints = [],
      visitedCells = []

    let curveWidthBounds = []
    if (fillPercent > 0.75) {
      curveWidthBounds = [3, 3]
    } else if (fillPercent > 0.5) {
      curveWidthBounds = random.bool() ? [2, 10] : [1, 5]
    } else if (fillPercent > 0.25) {
      curveWidthBounds = random.bool() ? [5, 25] : [5, 15]
    } else {
      curveWidthBounds = random.bool() ? [10, 30] : [10, 20]
    }
    const curveWidth = random.real(curveWidthBounds[0], curveWidthBounds[1])

    for (let point = 0; point < numPoints; point++) {
      const pointVector = new Point(x, y)
      const flowFieldPoint = sampleFlowField(pointVector)
      const rotation = flowField[flowFieldPoint.i][flowFieldPoint.j]
      const offsetVector = new Point(0, 1).rotate(rotation * RAD_TO_DEG, [0, 0])
      if (cellVisited[flowFieldPoint.i][flowFieldPoint.j]) return { points, oppositePoints, visitedCells }

      for (let k = 0; k <= Math.ceil(curveWidth); k++) {
        const offsetStep = offsetVector.multiply(k).add(pointVector)
        const flowFieldOffset = sampleFlowField(offsetStep)
        if (cellVisited[flowFieldOffset.i][flowFieldOffset.j]) return { points, oppositePoints, visitedCells }
        visitedCells.push(flowFieldOffset)
      }

      const oppositePoint = offsetVector.multiply(curveWidth).add(pointVector)
      points.push(pointVector)
      oppositePoints.unshift(oppositePoint)

      x += stepLength * cos(rotation)
      y += stepLength * sin(rotation)
    }

    return { points, oppositePoints, visitedCells }
  }

  function sampleFlowField(point: Point) {
    const i = Math.floor(map(point.x, -params.width / 2, params.width / 2, 0, flowFieldResolution))
    const j = Math.floor(map(point.y, params.height / 2, -params.height / 2, 0, flowFieldResolution))
    return { i, j }
  }

  function generatePalette() {
    const mainHue = random.real(0, 360)
    const hues = [mainHue, (mainHue + 120) % 360, (mainHue + 240) % 360]
    const sats = [random.normal(25, 10), random.normal(50, 10), random.normal(75, 10)]
    const vals = [80, 90, 100]
    const palette: ColorSource[] = cartesian(hues, sats, vals).map((color) => {
      return { h: color[0], s: color[1], v: color[2] }
    })
    palette.push("white")
    return palette
  }

  function cartesian<T>(...allEntries: T[][]) {
    return allEntries.reduce<T[][]>(
      (results, entries) =>
        results
          .map((result) => entries.map((entry) => result.concat([entry])))
          .reduce((subResults, result) => subResults.concat(result), []),
      [[]]
    )
  }
})
