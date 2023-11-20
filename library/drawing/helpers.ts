import { Box } from "@flatten-js/core"
import { ColorSource, Graphics } from "pixi.js"

/**
 * Draw a rectangle with uniform fill to be used as a background.
 * The size of a rectangle is twice the size of a viewport, so that when scene is rotated
 * there are no blank spaces in the corners.
 * @param color background color
 * @param bbox viewport bounding box
 * @returns {Graphics}
 */
export function drawBackground(color: ColorSource, bbox: Box): Graphics {
  return new Graphics().beginFill(color).drawRect(-bbox.width, -bbox.height, bbox.width * 2, bbox.height * 2)
}

/**
 * Helper function to create {@link ColorSource} from grayscale value
 * @param gray grayscale value [0-255]
 * @returns {ColorSource}
 */
export function gray(gray: number): ColorSource {
  return { r: gray, g: gray, b: gray }
}
