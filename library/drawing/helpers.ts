import { Box } from "@flatten-js/core"
import { ColorSource, Graphics, MSAA_QUALITY, Renderer, Sprite } from "pixi.js"

export function drawBackground(color: ColorSource, bbox: Box) {
  return new Graphics().beginFill(color).drawRect(-bbox.width, -bbox.height, bbox.width * 2, bbox.height * 2)
}

export function renderGraphics(graphics: Graphics, renderer: Renderer): Sprite {
  const texture = renderer.generateTexture(graphics, { multisample: MSAA_QUALITY.NONE })
  const sprite = new Sprite(texture)
  const bounds = graphics.getBounds()
  // Assume [0, 0] is inside bounds
  sprite.pivot.set(-bounds.x, -bounds.y)
  sprite.scale.set(1, -1)
  return sprite
}

export function gray(gray: number): ColorSource {
  return { r: gray, g: gray, b: gray }
}
