import { box } from "@flatten-js/core"
import { createEntropy, MersenneTwister19937 as MersenneTwister } from "random-js"
import { resizeCanvasToDisplaySize } from "twgl.js"

import { Random } from "./random"
import { SketchRenderer } from "./renderer"
import {
  ExportParams,
  ICanvas,
  SizeParams,
  SketchCreator,
  SketchInstance,
  SketchParams,
  SketchType,
  UpdateFn,
} from "./types"

/** Class for wrapping sketch and controlling RNG state */
class Sketch<T extends SketchType, C extends ICanvas> implements SketchLike<C> {
  /** Seed for initializing random generator */
  public readonly seed: number[]
  /** Sketch size parameters */
  private params: Required<SizeParams>
  /** Using [Mersenne twister](http://en.wikipedia.org/wiki/Mersenne_twister) algorithm for repeatability */
  private mersenneTwister: MersenneTwister
  /** RNG instance */
  private random: Random
  /** RNG use count (for repeatability of random numbers) */
  private randomUseCount = 0
  /** Current sketch instance */
  private instance?: SketchInstance<T>

  /**
   * @param type framework type used by this sketch
   * @param sketchCreator function producing new sketch instances
   * @param renderer renderer to use for this sketch
   * @param params parameters object defining sketch size, render resolution and RNG seed
   */
  constructor(
    private type: T,
    private sketchCreator: SketchCreator<T>,
    private renderer: SketchRenderer<C>,
    params: SketchParams
  ) {
    this.params = { resolution: 1, ...params }
    this.seed = params.seed || createEntropy()
    this.mersenneTwister = MersenneTwister.seedWithArray(this.seed)
    this.random = new Random(this.mersenneTwister)
  }

  /**
   * Wrapper for sketch update function
   * @returns underlying sketch instance's update function
   * @internal
   */
  get update() {
    return this.instance?.update
  }

  /**
   * Check if sketch is updatable
   * @returns true if sketch has update function
   */
  get updatable() {
    return this.update !== undefined
  }

  /**
   * Sketch size parameters
   * @returns size params
   */
  get size(): Required<SizeParams> {
    return this.params
  }

  /**
   * Canvas that this sketch renders to
   * @returns canvas
   */
  get canvas() {
    return this.renderer.getCanvas(this.type)
  }

  /**
   * Render this sketch
   */
  render() {
    const instance = this.instance || this.iterate()
    this.params = this.renderer.render(instance, this.params)
    this.instance = instance
  }

  /**
   * Render this sketch and export render result
   * @param exportParams optional overrides for rendering size params and image type
   * @returns renderer's canvas contents as blob
   */
  async export(exportParams?: ExportParams): Promise<Blob> {
    const currentParams = { ...this.params }
    Object.assign(this.params, exportParams)
    this.render()
    this.params = currentParams

    const canvas = this.canvas
    const blobPromise =
      "convertToBlob" in canvas
        ? canvas.convertToBlob({ type: exportParams?.format })
        : new Promise<Blob>((ok, err) => canvas.toBlob((blob) => (blob ? ok(blob) : err), exportParams?.format))
    return blobPromise
  }

  /**
   * Generate new sketch instance
   * @internal
   */
  next() {
    this.destroy()
    // We store how many random values were generated so far, so that when canvas is resized we could
    // "replay" RNG from this point
    this.randomUseCount = this.mersenneTwister.getUseCount()
    this.instance = this.iterate()
  }

  /**
   * Resize this sketch
   * @param params new {@link SizeParams}
   */
  resize(params: Partial<SizeParams>) {
    const currentParams = this.params
    Object.assign(this.params, params)
    if (this.params.width !== currentParams.width || this.params.height !== currentParams.height) {
      this.destroy()
      // When resizing sketch we want RNG to repeat the same values
      // Which is why we need to recreate the state that was prior to last sketch run
      this.mersenneTwister = MersenneTwister.seedWithArray(this.seed).discard(this.randomUseCount)
      this.random = new Random(this.mersenneTwister)
      this.instance = this.iterate()
    }
  }

  /**
   * Method to generate new sketch instance
   * @returns sketch instance with wrapped container
   */
  private iterate(): SketchInstance<T> {
    const random = this.random
    const { width, height } = this.params
    // Calculate bounding box
    const bbox = box(-width / 2, -height / 2, width / 2, height / 2)
    return this.sketchCreator({ random, bbox, ...this.renderer.getRenderingContext(this.type) })
  }

  /** Destroy current sketch container and free associated memory */
  private destroy() {
    if (this.instance && "container" in this.instance) {
      this.instance.container.destroy({
        children: true,
        texture: false,
        textureSource: false,
        //context: true, // TODO: Bug with shared context
      })
    }
    this.instance = undefined
  }
}

/** Interface for curried {@link SketchCreator} functions with {@link SketchType} already set */
export interface SketchConstructor {
  <C extends ICanvas>(renderer: SketchRenderer<C>, params: SketchParams): ISketch<C>
}

/**
 * Interface for sketches that aren't using {@link SketchRenderer} (such as WebGL)
 * in order to enable interop with {@link SketchRunner} and {@link UI}
 */
export interface SketchLike<C extends ICanvas> {
  readonly canvas: C
  /** @internal */
  update?: UpdateFn
  render(): void
  /** @internal */
  next(): void
  resize(params: Partial<SizeParams>): void
}

/**
 * Helper method to define Pixi.js sketch
 * @param sketchCreator function producing new sketch instances
 * @returns function that creates Pixi.js sketch with given params
 */
export function pixi(sketchCreator: SketchCreator<"pixi">): SketchConstructor {
  return (renderer, params) => new Sketch("pixi", sketchCreator, renderer, params)
}

/**
 * Helper method to define Three.js sketch
 * @param sketchCreator function producing new sketch instances
 * @returns function that creates Three.js sketch with given params
 */
export function three(sketchCreator: SketchCreator<"three">): SketchConstructor {
  return (renderer, params) => new Sketch("three", sketchCreator, renderer, params)
}

export type ISketch<C extends ICanvas = HTMLCanvasElement> = {
  [P in keyof Sketch<SketchType, C>]: Sketch<SketchType, C>[P]
}

// TODO: Refactor to Sketch class
type WebglSketchCreator = (context: {
  gl: WebGL2RenderingContext
  random: Random
}) => Omit<SketchLike<HTMLCanvasElement>, "canvas" | "resize">
type WebglSketchConstructor = (canvas: HTMLCanvasElement, params?: SketchParams) => SketchLike<HTMLCanvasElement>
/**
 * Helper method to define WebGL sketch
 * @param sketchCreator function producing new sketch instances
 * @returns function that creates WebGL sketch with given params
 */
export function webgl(sketchCreator: WebglSketchCreator): WebglSketchConstructor {
  return (canvas, params) => {
    const seed = params?.seed || createEntropy()
    const mersenneTwister = MersenneTwister.seedWithArray(seed)
    const random = new Random(mersenneTwister)

    let resolution = params?.resolution || 1
    params && resize(params)

    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext
    const sketch = sketchCreator({ gl, random })

    return {
      canvas,
      resize,
      next: sketch.next.bind(sketch),
      update: sketch.update?.bind(sketch),
      render() {
        resizeCanvasToDisplaySize(canvas, resolution)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        sketch.render()
      },
    }

    function resize(params: Partial<SizeParams>) {
      params.width && (canvas.style.width = `${params.width}px`)
      params.height && (canvas.style.height = `${params.height}px`)
      params.resolution && (resolution = params.resolution)
    }
  }
}
