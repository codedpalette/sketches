import { Box } from "@flatten-js/core"
import { ColorSource, Graphics } from "pixi.js"

export function drawBackground(color: ColorSource, bbox: Box) {
  return new Graphics().beginFill(color).drawRect(-bbox.width, -bbox.height, bbox.width * 2, bbox.height * 2)
}

export function gray(gray: number): ColorSource {
  return { r: gray, g: gray, b: gray }
}
