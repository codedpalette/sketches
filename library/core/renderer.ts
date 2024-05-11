import "pixi.js/filters"
import "pixi.js/graphics"
import "pixi.js/mesh"

import { BrowserAdapter, Container, DOMAdapter, Matrix, WebGLRenderer as PixiRenderer, WebWorkerAdapter } from "pixi.js"
import { WebGLRenderer as ThreeRenderer } from "three"

import { ICanvas, RenderParams, SizeParams, SketchInstance, SketchRenderingContext, SketchType } from "./types"

const isBrowser = typeof window === "object"
DOMAdapter.set(isBrowser ? BrowserAdapter : WebWorkerAdapter)
const defaultRenderParams: RenderParams = { antialias: true, resizeCSS: isBrowser }

/** Class for abstracting over framework renderers (only Pixi.js for now) */
class Renderer<C extends ICanvas> {
  /** Three.js {@link ThreeRenderer} */
  private _threeRenderer?: ThreeRenderer

  /**
   * Renderer constructor
   * @param pixiRenderer Pixi.js {@link PixiRenderer}
   * @param params {@link RenderParams}
   */
  constructor(private pixiRenderer: PixiRenderer<C>, private params: RenderParams<C>) {}

  private get threeRenderer(): ThreeRenderer {
    return (
      this._threeRenderer ??
      (this._threeRenderer = new ThreeRenderer({
        antialias: this.params.antialias,
        canvas: DOMAdapter.get().createCanvas() as HTMLCanvasElement | OffscreenCanvas,
      }))
    )
  }

  getCanvas<T extends SketchType>(type: T): C {
    return type === "pixi" ? this.pixiRenderer.canvas : (this.threeRenderer.domElement as C)
  }

  /**
   * Get rendering context for sketch initialization
   * @param type sketch framework type
   * @returns SketchRenderingContext
   * @internal
   */
  getRenderingContext<T extends SketchType>(type: T): SketchRenderingContext<T> {
    const renderer = type === "pixi" ? this.pixiRenderer : this.threeRenderer
    return { renderer } as SketchRenderingContext<T>
  }

  /**
   * Render a sketch with this renderer
   * @param sketch {@link SketchInstance}
   * @param params {@link SizeParams}
   * @internal
   * @returns Actual size of the rendered sketch
   */
  render<T extends SketchType>(sketch: SketchInstance<T>, params: Required<SizeParams>) {
    const type = "container" in sketch ? "pixi" : "three"
    if (this.needsResize(type, params)) this.resize(type, params)

    if ("container" in sketch) {
      const stage = new Container()
      // Set transform matrix to translate (0, 0) to the viewport center and point Y-axis upwards
      stage.setFromMatrix(new Matrix().scale(1, -1).translate(params.width / 2, params.height / 2))
      stage.addChild(sketch.container)

      this.pixiRenderer.render(stage)
    } else {
      this.threeRenderer.render(sketch.scene, sketch.camera)
    }
    return this.getSizeParams(type)
  }

  /** Destroy this renderer */
  destroy() {
    this.pixiRenderer.destroy()
    this.threeRenderer?.dispose()
  }

  private needsResize(type: SketchType, newParams: Required<SizeParams>): boolean {
    const { width, height, resolution } = this.getSizeParams(type)
    return resolution != newParams.resolution || width != newParams.width || height != newParams.height
  }

  private resize(type: SketchType, params: Required<SizeParams>) {
    if (type === "pixi") {
      this.pixiRenderer.resolution = params.resolution
      this.pixiRenderer.resize(params.width, params.height)
    } else {
      this.threeRenderer.setPixelRatio(params.resolution)
      this.threeRenderer.setSize(params.width, params.height, this.params.resizeCSS)
    }

    // Some browsers have limits for WebGL drawbuffer dimensions. If we set renderer resolution too high,
    // it may cause actual drawbuffer dimensions to be higher than these limits. In order to check for this
    // we compare requested renderer dimensions to actual drawbuffer dimensions, and if they're higher,
    // reset resolution to 1. See for example https://github.com/mrdoob/three.js/issues/5917 for more details.
    const { width: requestedWidth, height: requestedHeight } = this.getSizeParams(type)
    const { drawingBufferWidth, drawingBufferHeight } =
      type == "pixi" ? this.pixiRenderer.gl : this.threeRenderer.getContext()
    if (requestedWidth > drawingBufferWidth || requestedHeight > drawingBufferHeight) {
      this.resize(type, { ...params, resolution: 1 })
    }
  }

  private getSizeParams(type: SketchType): Required<SizeParams> {
    if (type == "pixi") {
      return {
        width: this.pixiRenderer.width,
        height: this.pixiRenderer.height,
        resolution: this.pixiRenderer.resolution,
      }
    } else {
      // three.js
      return {
        width: this.threeRenderer.domElement.width,
        height: this.threeRenderer.domElement.height,
        resolution: this.threeRenderer.getPixelRatio(),
      }
    }
  }
}
/**
 * Initialize a renderer
 * @param params parameters overrides for renderer
 * @returns Promise that resolves to renderer
 */
export async function init<C extends ICanvas>(params?: Partial<RenderParams<C>>): Promise<SketchRenderer<C>> {
  const renderParams = { ...defaultRenderParams, ...params } as RenderParams<C>
  const pixiRenderer = new PixiRenderer<C>()
  await pixiRenderer.init({
    canvas: renderParams.canvas,
    antialias: renderParams.antialias,
    autoDensity: renderParams.resizeCSS,
  })
  return new Renderer(pixiRenderer, renderParams)
}

export type SketchRenderer<C extends ICanvas = ICanvas> = {
  [P in keyof Renderer<C>]: Renderer<C>[P]
}
