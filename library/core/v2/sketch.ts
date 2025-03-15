import { Box, box } from "@flatten-js/core"
import { Container, Matrix } from "pixi.js"

import { Random } from "../random"

export type SketchContext = Readonly<{
  random: Random
  bbox: Box
}>

export type SizeParams = Readonly<{
  width: number
  height: number
}>

type IPixiSketch = (context: SketchContext) => { container: Container }

export class PixiSketch {
  private random = new Random()
  private _stage?: Container
  constructor(
    private sketch: IPixiSketch,
    readonly size: SizeParams,
  ) {}

  get stage() {
    if (!this._stage) this.next()
    return this._stage!
  }

  next() {
    const { width, height } = this.size
    const bbox = box(-width / 2, -height / 2, width / 2, height / 2)
    const container = this.sketch({ random: this.random, bbox }).container
    const stage = new Container()
    // Set transform matrix to translate (0, 0) to the viewport center and point Y-axis upwards
    stage.setFromMatrix(new Matrix().scale(1, -1).translate(width / 2, height / 2))
    stage.addChild(container)
    this._stage = stage
  }
}
