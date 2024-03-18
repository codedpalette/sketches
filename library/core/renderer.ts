import { autoDetectRenderer, BrowserAdapter, DOMAdapter, ICanvas, WebGLRenderer, WebWorkerAdapter } from "pixi.js"

import { SizeParams, SketchInstance } from "./types"

/** Parameters for controlling rendering process */
export type RenderParams<T extends ICanvas = HTMLCanvasElement> = {
  /** Enable WebGL antialiasing */
  antialias: boolean
  /** Whether or not to resize canvas css dimensions when resizing renderer*/
  resizeCSS: boolean
  /** Should the renderer clear the canvas before render pass */
  clearBefore: boolean
  /** Optional canvas for renderer to render onto */
  canvas?: T
}

const isBrowser = typeof window === "object"
const defaultRenderParams: RenderParams = { antialias: true, resizeCSS: isBrowser, clearBefore: true }
DOMAdapter.set(isBrowser ? BrowserAdapter : WebWorkerAdapter)

/** Class for abstracting over framework renderers (only Pixi.js for now) */
export class SketchRenderer<T extends ICanvas = HTMLCanvasElement> {
  /** Internal canvas that this renderer renders to */
  public readonly canvas: T
  /**
   * Pixi.js {@link WebGLRenderer}
   * @internal
   */
  public readonly renderer: WebGLRenderer<T>

  /**
   * Renderer constructor
   * @param renderer Pixi.js {@link WebGLRenderer}
   */
  private constructor(renderer: WebGLRenderer<T>) {
    this.renderer = renderer
    this.canvas = renderer.canvas
  }

  /**
   * initialize this renderer
   * @param params parameters overrides for this renderer
   * @returns Promise that resolves to renderer
   */
  static async init(params?: Partial<RenderParams>): Promise<SketchRenderer> {
    const renderParams = { ...defaultRenderParams, ...params }
    const renderer = (await autoDetectRenderer({
      canvas: renderParams.canvas,
      antialias: renderParams.antialias,
      autoDensity: renderParams.resizeCSS,
      clearBeforeRender: renderParams.clearBefore,
      preference: "webgl",
    })) as WebGLRenderer
    return new SketchRenderer(renderer)
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
