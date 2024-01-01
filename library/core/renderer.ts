import { BrowserAdapter, Renderer, settings, WebWorkerAdapter } from "pixi.js"

import { Sketch } from "./sketch"
import { Canvas, RenderParams, SizeParams } from "./types"

const isBrowser = typeof window === "object"
const defaultRenderParams: RenderParams = { antialias: true, resizeCSS: isBrowser }
settings.ADAPTER = isBrowser ? BrowserAdapter : WebWorkerAdapter

/** Class for abstracting over framework renderers (only Pixi.js for now) */
export class SketchRenderer<ICanvas extends Canvas = Canvas> {
  /** Internal canvas that this renderer renders to */
  public readonly canvas: ICanvas
  /** Pixi.js {@link Renderer} */
  public readonly renderer: Renderer

  constructor(params?: Partial<RenderParams>) {
    const renderParams = { ...defaultRenderParams, ...params }
    // Initialize Pixi.js WebGL renderer
    this.renderer = new Renderer({
      antialias: renderParams.antialias,
      autoDensity: renderParams.resizeCSS,
    })
    this.canvas = this.renderer.view as ICanvas
  }

  /**
   * Render a sketch with this renderer
   * @param sketch {@link Sketch}
   */
  render(sketch: Sketch) {
    this.resize(sketch.params)
    this.renderer.render(sketch.container)
  }

  /** Destroy this renderer */
  destroy() {
    this.renderer.destroy()
  }

  /**
   * Resize renderer
   * @param {SizeParams} params New size parameters for this renderer
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