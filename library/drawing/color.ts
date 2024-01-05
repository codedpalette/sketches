import { formatHex } from "culori"
import { ColorSource } from "pixi.js"

/**
 * Convert an HSL value to Pixi.js {@link ColorSource}
 * @param hsl array of HSL channel values, h in [0, 360], s in [0, 1], l in [0, 1]
 * @returns ColorSource
 */
export function formatHsl(hsl: [number, number, number]): ColorSource {
  return formatHex({ mode: "hsl", h: hsl[0], s: hsl[1], l: hsl[2] })
}

/**
 * Helper function to create {@link ColorSource} from grayscale value
 * @param gray grayscale value [0-255]
 * @returns ColorSource
 */
export function gray(gray: number): ColorSource {
  return { r: gray, g: gray, b: gray }
}
