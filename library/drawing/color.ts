import { formatHex } from "culori"
import { ColorSource } from "pixi.js"

/**
 * Convert an HSL value to Pixi.js {@link ColorSource}
 * @param hsl array of HSL channel values, h in [0, 360], s in [0, 1], l in [0, 1]
 * @returns
 */
export function formatHsl(hsl: [number, number, number]): ColorSource {
  return formatHex({ mode: "hsl", h: hsl[0], s: hsl[1], l: hsl[2] })
}
