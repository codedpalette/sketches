import {
  autoDetectRenderer,
  BrowserAdapter,
  Container,
  DOMAdapter,
  ICanvas,
  Matrix,
  WebGLRenderer,
  WebWorkerAdapter,
} from "pixi.js"

import { RenderParams, SizeParams, SketchInstance, SketchRenderingContext, SketchType } from "./types"

const isBrowser = typeof window === "object"
const defaultRenderParams: RenderParams = { antialias: true, resizeCSS: isBrowser }
DOMAdapter.set(isBrowser ? BrowserAdapter : WebWorkerAdapter)

/** Class for abstracting over framework renderers (only Pixi.js for now) */
export class SketchRenderer<C extends ICanvas> {
  /** Internal canvas that this renderer renders to */
  public readonly canvas: C
  /**
   * Pixi.js {@link WebGLRenderer}
   * @internal
   */
  public readonly renderer: WebGLRenderer<C>

  /**
   * Renderer constructor
   * @param renderer Pixi.js {@link WebGLRenderer}
   */
  private constructor(renderer: WebGLRenderer<C>) {
    this.renderer = renderer
    this.canvas = renderer.canvas
  }

  /**
   * initialize this renderer
   * @param params parameters overrides for this renderer
   * @returns Promise that resolves to renderer
   */
  static async init<C extends ICanvas>(params?: Partial<RenderParams>): Promise<SketchRenderer<C>> {
    const renderParams = { ...defaultRenderParams, ...params }
    const renderer = (await autoDetectRenderer({
      canvas: renderParams.canvas,
      antialias: renderParams.antialias,
      autoDensity: renderParams.resizeCSS,
      preference: "webgl",
    })) as unknown as WebGLRenderer<C>
    return new SketchRenderer(renderer)
  }

  /**
   * Get rendering context for sketch initialization
   * @param type sketch framework type
   * @returns SketchRenderingContext
   */
  getRenderingContext<T extends SketchType>(type: T): SketchRenderingContext<T> {
    if (type === "pixi") {
      return { renderer: this.renderer } as unknown as SketchRenderingContext<T>
    } else {
      // TODO: Three.js
      return { gl: this.canvas.getContext("webgl2") } as unknown as SketchRenderingContext<T>
    }
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
