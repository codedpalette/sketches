import { Box, box } from "@flatten-js/core"
import { Random } from "library/core/random"
import { clamp } from "library/utils"
import { PointData } from "pixi.js"

/**
 * Generate random packing by splitting given rectangle in random points on the grid
 * @param boundsBox rectangle to split
 * @param gridFactor factor for calculating grid step based on boundsBox dimensions, [0-1]
 * @param random random number generator
 * @returns array of rectangles
 */
export function rectanglePacking(boundsBox: Box, gridFactor: number, random: Random): Box[] {
  const rects = [boundsBox]
  const factor = clamp(gridFactor, 0, 1)
  const xStep = boundsBox.width * factor
  const yStep = boundsBox.height * factor
  const diagonalSteps = 1 / factor
  for (let i = 1; i < diagonalSteps; i++) {
    splitRectsWith({ y: boundsBox.ymin + i * yStep }, rects, random)
    splitRectsWith({ x: boundsBox.xmin + i * xStep }, rects, random)
  }
  return rects
}

function splitRectsWith(point: Partial<PointData>, rects: Box[], random: Random) {
  const { x, y } = point

  for (let i = rects.length - 1; i >= 0; i--) {
    const rect = rects[i]
    if (x !== undefined && x > rect.xmin && x < rect.xmax) {
      if (random.bool()) {
        const splitAt = x
        rects.splice(i, 1)
        rects.push(box(rect.xmin, rect.ymin, splitAt, rect.ymax))
        rects.push(box(splitAt, rect.ymin, rect.xmax, rect.ymax))
      }
    }
    if (y !== undefined && y > rect.ymin && y < rect.ymax) {
      if (random.bool()) {
        const splitAt = y
        rects.splice(i, 1)
        rects.push(box(rect.xmin, rect.ymin, rect.xmax, splitAt))
        rects.push(box(rect.xmin, splitAt, rect.xmax, rect.ymax))
      }
    }
  }
}
