import { Point, point } from "@flatten-js/core"

/**
 * Convert a point from polar coordinates to cartesian
 * @param r radius vector length
 * @param theta radius vector angle from the X axis (in radians)
 * @returns {Point}
 */
export function fromPolar(r: number, theta: number): Point {
  return point(r * Math.cos(theta), r * Math.sin(theta))
}
