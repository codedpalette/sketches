import "pixi.js/filters"
import "pixi.js/graphics"
import "pixi.js/mesh"

import { BrowserAdapter, Container, DOMAdapter, Matrix, WebGLRenderer, WebWorkerAdapter } from "pixi.js"

import { ICanvas, RenderParams, SizeParams, SketchInstance, SketchRenderingContext, SketchType } from "./types"

const isBrowser = typeof window === "object"
DOMAdapter.set(isBrowser ? BrowserAdapter : WebWorkerAdapter)
const defaultRenderParams: RenderParams = { antialias: true, resizeCSS: isBrowser }

/** Class for abstracting over framework renderers (only Pixi.js for now) */
class Renderer<C extends ICanvas> {
  /** Internal canvas that this renderer renders to */
  public readonly canvas: C
  /** Pixi.js {@link WebGLRenderer} */
  private renderer: WebGLRenderer<C>

  /**
   * Renderer constructor
   * @param renderer Pixi.js {@link WebGLRenderer}
   */
  constructor(renderer: WebGLRenderer<C>) {
    this.renderer = renderer
    this.canvas = renderer.canvas
  }

  /**
   * Get rendering context for sketch initialization
   * @param type sketch framework type
   * @returns SketchRenderingContext
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  getRenderingContext<T extends SketchType>(type: T): SketchRenderingContext<T> {
    return { renderer: this.renderer }
  }

  /**
   * Render a sketch with this renderer
   * @param sketch {@link SketchInstance}
   * @param params {@link SizeParams}
   * @internal
   */
  render(sketch: SketchInstance<"pixi">, params: Required<SizeParams>) {
    if (this.needsResize(params)) this.resize(params)

    const stage = new Container()
    // Set transform matrix to translate (0, 0) to the viewport center and point Y-axis upwards
    stage.setFromMatrix(new Matrix().scale(1, -1).translate(params.width / 2, params.height / 2))
    stage.addChild(sketch.container)

    this.renderer.render(stage)
  }

  /** Destroy this renderer */
  destroy() {
    this.renderer.destroy()
  }

  private needsResize(newParams: Required<SizeParams>): boolean {
    return (
      this.renderer.resolution != newParams.resolution ||
      this.renderer.width != newParams.width ||
      this.renderer.height != newParams.height
    )
  }

  /**
   * Resize renderer
   * @param params New size parameters for this renderer
   */
  private resize(params: Required<SizeParams>) {
    this.renderer.resolution = params.resolution
    this.renderer.resize(params.width, params.height)

    // Some browsers have limits for WebGL drawbuffer dimensions. If we set renderer resolution too high,
    // it may cause actual drawbuffer dimensions to be higher than these limits. In order to check for this
    // we compare requested renderer dimensions to actual drawbuffer dimensions, and if they're higher,
    // reset resolution to 1. See for example https://github.com/mrdoob/three.js/issues/5917 for more details.
    const drawBufferWidth = this.renderer.gl.drawingBufferWidth
    const drawBufferHeight = this.renderer.gl.drawingBufferHeight
    if (this.renderer.width > drawBufferWidth || this.renderer.height > drawBufferHeight) {
      this.renderer.resolution = 1
      this.renderer.resize(params.width, params.height)
    }
  }
}
/**
 * Initialize a renderer
 * @param params parameters overrides for renderer
 * @returns Promise that resolves to renderer
 */
export async function init<C extends ICanvas>(params?: Partial<RenderParams<C>>): Promise<SketchRenderer<C>> {
  const renderParams = { ...defaultRenderParams, ...params }
  const renderer = new WebGLRenderer<C>()
  await renderer.init({
    canvas: renderParams.canvas,
    antialias: renderParams.antialias,
    autoDensity: renderParams.resizeCSS,
  })
  return new Renderer(renderer)
}

// TODO: Public exported interface
export type SketchRenderer<C extends ICanvas = ICanvas> = {
  [P in keyof Renderer<C>]: Renderer<C>[P]
}
