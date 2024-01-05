import { Point, point } from "@flatten-js/core"

/**
 * @param path path to asset relative to `assets` folder in the workspace root
 * @returns resolved URL to a static asset
 */
export function asset(path: string): string {
  // https://vitejs.dev/guide/assets.html#new-url-url-import-meta-url
  return new URL(`/assets/${path}`, import.meta.url).href
}

/**
 * Re-maps a number from one range to another.
 * Ported from {@link https://p5js.org/reference/#/p5/map p5.js map function}
 * @param x the value to be converted
 * @param x0 lower bound of the value's current range
 * @param x1 upper bound of the value's current range
 * @param y0 lower bound of the value's target range
 * @param y1 upper bound of the value's target range
 * @returns value mapped to a target range
 */
export function map(x: number, x0: number, x1: number, y0: number, y1: number): number {
  return ((x - x0) / (x1 - x0)) * (y1 - y0) + y0
}

/**
 * @param x the value to be clamped
 * @param a lower bound of the clamp
 * @param b upper bound of the clamp
 * @returns value clamped to a specified range
 */
export function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(x, b))
}

/**
 * @param r radius vector length
 * @param theta radius vector angle from the X axis (in radians)
 * @returns point in cartesian coordinates
 */
export function fromPolar(r: number, theta: number): Point {
  return point(r * Math.cos(theta), r * Math.sin(theta))
}
