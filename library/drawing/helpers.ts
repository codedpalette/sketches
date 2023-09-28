import { ColorSource, Graphics } from "pixi.js"

export function drawBackground(color: ColorSource, params: { width: number; height: number }) {
  return new Graphics().beginFill(color).drawRect(-params.width / 2, -params.height / 2, params.width, params.height)
}
