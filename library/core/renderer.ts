import "pixi.js/filters"
import "pixi.js/graphics"
import "pixi.js/mesh"

import { BrowserAdapter, Container, DOMAdapter, Matrix, WebGLRenderer as PixiRenderer, WebWorkerAdapter } from "pixi.js"
import { Vector2, WebGLRenderer as ThreeRenderer } from "three"

import { ICanvas, RenderParams, SizeParams, SketchInstance, SketchRenderingContext, SketchType } from "./types"

const isBrowser = typeof window === "object"
DOMAdapter.set(isBrowser ? BrowserAdapter : WebWorkerAdapter)
const defaultRenderParams: RenderParams = { antialias: true, resizeCSS: isBrowser }

/** Class for abstracting over framework renderers (only Pixi.js for now) */
class Renderer<C extends ICanvas> {
  /** Internal canvas that this renderer renders to */
  public readonly canvas: C
  /** Pixi.js {@link PixiRenderer} */
  private pixiRenderer: PixiRenderer<C>
  /** Three.js {@link ThreeRenderer} */
  private threeRenderer: ThreeRenderer
  private lastRenderedType?: SketchType

  /**
   * Renderer constructor
   * @param pixiRenderer Pixi.js {@link PixiRenderer}
   * @param threeRenderer Three.js {@link ThreeRenderer}
   * @param params {@link RenderParams}
   */
  constructor(pixiRenderer: PixiRenderer<C>, threeRenderer: ThreeRenderer, private params: RenderParams<C>) {
    this.pixiRenderer = pixiRenderer
    this.threeRenderer = threeRenderer
    this.canvas = pixiRenderer.canvas
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
   */
  render<T extends SketchType>(sketch: SketchInstance<T>, params: Required<SizeParams>) {
    const type = "container" in sketch ? "pixi" : "three"
    const needsReset = this.lastRenderedType !== type
    if (this.needsResize(type, params)) this.resize(type, params)

    if ("container" in sketch) {
      const stage = new Container()
      // Set transform matrix to translate (0, 0) to the viewport center and point Y-axis upwards
      stage.setFromMatrix(new Matrix().scale(1, -1).translate(params.width / 2, params.height / 2))
      stage.addChild(sketch.container)

      if (needsReset) {
        this.pixiRenderer.runners.contextChange.emit(this.pixiRenderer.gl)
      }
      this.pixiRenderer.render(stage)
    } else {
      if (needsReset) this.threeRenderer.resetState()
      this.threeRenderer.render(sketch.scene, sketch.camera)
    }
    this.lastRenderedType = type
  }

  /** Destroy this renderer */
  destroy() {
    this.pixiRenderer.destroy()
    this.threeRenderer.dispose()
  }

  private needsResize(type: SketchType, newParams: Required<SizeParams>): boolean {
    const threeRendererSize = this.threeRenderer.getSize(new Vector2())
    const { width, height, resolution } =
      type === "pixi"
        ? this.pixiRenderer
        : {
            width: threeRendererSize.width,
            height: threeRendererSize.height,
            resolution: this.threeRenderer.getPixelRatio(),
          }
    return resolution != newParams.resolution || width != newParams.width || height != newParams.height
  }

  private resize(type: SketchType, params: Required<SizeParams>) {
    if (type === "pixi") {
      this.pixiRenderer.resolution = params.resolution
      this.pixiRenderer.resize(params.width, params.height)
    } else {
      this.threeRenderer.setSize(params.width, params.height, this.params.resizeCSS)
      this.threeRenderer.setPixelRatio(params.resolution)
    }

    // Some browsers have limits for WebGL drawbuffer dimensions. If we set renderer resolution too high,
    // it may cause actual drawbuffer dimensions to be higher than these limits. In order to check for this
    // we compare requested renderer dimensions to actual drawbuffer dimensions, and if they're higher,
    // reset resolution to 1. See for example https://github.com/mrdoob/three.js/issues/5917 for more details.
    // FIXME: This causes resize to run every frame
    const { width: requestedWidth, height: requestedHeight } = this.canvas
    const { drawingBufferWidth, drawingBufferHeight } =
      type == "pixi" ? this.pixiRenderer.gl : this.threeRenderer.getContext()
    if (requestedWidth > drawingBufferWidth || requestedHeight > drawingBufferHeight) {
      this.resize(type, { ...params, resolution: 1 })
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
  const threeRenderer = new ThreeRenderer({
    canvas: pixiRenderer.canvas,
    antialias: renderParams.antialias,
  })
  return new Renderer(pixiRenderer, threeRenderer, renderParams)
}

export type SketchRenderer<C extends ICanvas = ICanvas> = {
  [P in keyof Renderer<C>]: Renderer<C>[P]
}
