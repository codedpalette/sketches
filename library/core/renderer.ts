import { BrowserAdapter, Filter, Renderer, settings, WebWorkerAdapter } from "pixi.js"

import { Canvas, RenderParams, SizeParams, SketchInstance } from "./types"

const isBrowser = typeof window === "object"
const defaultRenderParams: RenderParams = { antialias: true, resizeCSS: isBrowser, clearBefore: true }
settings.ADAPTER = isBrowser ? BrowserAdapter : WebWorkerAdapter
Filter.defaultResolution = null // set default filter resolution to renderer's resolution

/** Class for abstracting over framework renderers (only Pixi.js for now) */
export class SketchRenderer<ICanvas extends Canvas = HTMLCanvasElement> {
  /** Internal canvas that this renderer renders to */
  public readonly canvas: ICanvas
  /**
   * Pixi.js {@link Renderer}
   * @internal
   */
  public readonly renderer: Renderer

  /**
   * @param params parameters overrides for this renderer
   */
  constructor(params?: Partial<RenderParams>) {
    const renderParams = { ...defaultRenderParams, ...params }
    // Initialize Pixi.js WebGL renderer
    this.renderer = new Renderer({
      view: renderParams.canvas,
      antialias: renderParams.antialias,
      autoDensity: renderParams.resizeCSS,
      clearBeforeRender: renderParams.clearBefore,
    })
    this.canvas = this.renderer.view as ICanvas
  }

  /**
   * Render a sketch with this renderer
   * @param sketch {@link SketchInstance}
   * @param params {@link SizeParams}
   * @internal
   */
  render(sketch: SketchInstance, params: Required<SizeParams>) {
    if (this.needsResize(params)) this.resize(params)
    this.renderer.render(sketch.container)
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
