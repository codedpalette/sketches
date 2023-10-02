import { Point, point } from "@flatten-js/core"

export function fromPolar(r: number, theta: number): Point {
  return point(r * Math.cos(theta), r * Math.sin(theta))
}
