import { setBackground } from "drawing/pixi"
import { run } from "drawing/sketch"
import { floor, pi } from "mathjs"
import { Container, Graphics } from "pixi.js"
import { map } from "utils/map"
import { random } from "utils/random"

//TODO: add smaller bright details

run((params) => {
  const cellSize = 10
  const cells: boolean[][] = []
  const cellsWidth = floor(params.width / cellSize)
  const cellsHeight = floor(params.height / cellSize)
  for (let i = 0; i < cellsWidth; i++) {
    cells[i] = []
    for (let j = 0; j < cellsHeight; j++) {
      cells[i][j] = false
    }
  }
  simulateAnt()

  const mainHue = random.real(0, 360)
  const mainSat = random.real(50, 100)
  const secondHue = (mainHue + 180) % 360
  const secondSat = random.real(50, 100)
  const container = new Container()
  container.rotation = random.bool() ? 0 : pi / 2
  setBackground(container, "black", params)

  for (let i = 0; i < cellsWidth; i++) {
    for (let j = 0; j < cellsHeight; j++) {
      const [hue, sat, bounds] =
        floor((i * cellSize) / 80) % 2 == 0
          ? [mainHue, mainSat, [cellsHeight, 0]]
          : [secondHue, secondSat, [0, cellsHeight]]
      const alpha = map(j, bounds[0], bounds[1], 0, 1)
      const val = map(j, bounds[0], bounds[1], 50, 100)
      const xNoise = map(j, bounds[0], bounds[1], 0, 40)
      if (cells[i][j]) {
        const x = i * cellSize + cellSize / 2 + random.real(-xNoise, xNoise)
        const y = j * cellSize + cellSize / 2
        const graphics = new Graphics()
          .beginFill({ h: hue, s: sat, v: val, a: alpha })
          .setTransform(
            x - params.width / 2,
            -y + params.height / 2,
            random.real(0.8, 2),
            random.real(0.8, 2),
            random.real(0, 2 * pi)
          )
        container.addChild(brokenRect(graphics))
      }
    }
  }

  return { container }

  function brokenRect(g: Graphics) {
    const dim = cellSize
    const x = -dim / 2
    const y = dim / 2
    const pointData = [
      { x: x + random.real(0, dim), y },
      { x: x + dim, y: y - random.real(0, dim) },
      { x: x + random.real(0, dim), y: y - dim },
      { x, y: y - random.real(0, dim) },
    ]
    g.drawPolygon(pointData)
    return g
  }

  function simulateAnt() {
    const numSteps = 500000
    let currX = random.integer(0, cellsWidth)
    let currY = random.integer(0, cellsHeight)
    let currDirection = random.integer(0, 3)

    for (let i = 0; i < numSteps; i++) {
      const currCell = cells[currX][currY]
      cells[currX][currY] = !currCell
      currDirection = currCell ? (currDirection + 3) % 4 : (currDirection + 1) % 4

      if (currDirection == 0) {
        currY--
      } else if (currDirection == 1) {
        currX++
      } else if (currDirection == 2) {
        currY++
      } else {
        currX--
      }

      currX = (currX + cellsWidth) % cellsWidth
      currY = (currY + cellsHeight) % cellsHeight
    }
  }
})
