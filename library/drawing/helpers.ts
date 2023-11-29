import { Box } from "@flatten-js/core"
import { ColorSource, Graphics, Sprite } from "pixi.js"

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

/**
 * Wrapper around HTML Canvas API to render it as Pixi.js {@link Sprite}
 * @param render Function taking {@link OffscreenCanvasRenderingContext2D} that does the actual drawing
 * @param bbox Bounding box defining canvas size
 * @returns {Sprite}
 */
export function renderCanvas(render: (ctx: OffscreenCanvasRenderingContext2D) => void, bbox: Box): Sprite {
  const canvas = new OffscreenCanvas(bbox.width, bbox.height)
  const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D
  render(ctx)

  const sprite = Sprite.from(canvas)
  // Since my sketches have Y-axis pointing up and point (0, 0) in the middle of a viewport,
  // and Canvas API assumes Y-axis pointing down and (0, 0) at top-left corner,
  // we need to set scale and anchor on Sprite to take that into account
  sprite.scale.set(1, -1)
  sprite.anchor.set(0.5, 0.5)
  return sprite
}
