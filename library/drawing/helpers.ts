import { ColorSource, Graphics } from "pixi.js"

export function drawBackground(color: ColorSource, params: { width: number; height: number }) {
  return new Graphics().beginFill(color).drawRect(-params.width, -params.height, params.width * 2, params.height * 2)
}

export function gray(gray: number): ColorSource {
  return { r: gray, g: gray, b: gray }
}
