import "pixi.js/filters"
import "pixi.js/graphics"
import "pixi.js/mesh"

import { WebGLRenderer } from "pixi.js"

import { PixiSketch, SizeParams } from "./sketch"

/**
 *
 */
export class Renderer {
  readonly canvas: HTMLCanvasElement
  /**
   *
   * @param pixiRenderer
   */
  constructor(private pixiRenderer: WebGLRenderer) {
    this.canvas = pixiRenderer.canvas
  }

  /**
   *
   * @param sketch
   */
  render(sketch: PixiSketch) {
    if (this.needsResize(sketch.size)) this.resize(sketch.size)
    this.pixiRenderer.render(sketch.stage)
  }

  private needsResize(sketchSize: SizeParams) {
    return sketchSize.width !== this.pixiRenderer.width || sketchSize.height !== this.pixiRenderer.height
  }

  private resize(sketchSize: SizeParams) {
    this.pixiRenderer.resize(sketchSize.width, sketchSize.height)
  }
}

/**
 *
 * @param canvas
 */
export async function initRenderer(canvas: HTMLCanvasElement) {
  const pixiRenderer = new WebGLRenderer()
  await pixiRenderer.init({ canvas, antialias: true })
  return new Renderer(pixiRenderer)
}
