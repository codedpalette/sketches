import { box } from "@flatten-js/core"
import { Container } from "pixi.js"
import { createEntropy, MersenneTwister19937 as MersenneTwister } from "random-js"

import { Random } from "./random"
import { SketchRenderer } from "./renderer"
import { Canvas, isHTMLCanvas, SizeParams, SketchFactory, SketchInstance } from "./types"

/** Class for wrapping sketch and controlling RNG state */
export class Sketch<ICanvas extends Canvas = HTMLCanvasElement> {
  /** Sketch size parameters */
  public readonly params: Required<SizeParams>
  /** Seed for initializing random generator */
  public readonly seed: number[]
  /** Using [Mersenne twister](http://en.wikipedia.org/wiki/Mersenne_twister) algorithm for repeatability */
  private mersenneTwister: MersenneTwister
  /** RNG instance */
  private random: Random
  /** RNG use count (for repeatability of random numbers) */
  private randomUseCount = 0
  /** Current sketch instance */
  private sketch?: SketchInstance

  /**
   * @param sketchFactory function producing new sketch instances
   * @param renderer renderer to use for this sketch
   * @param params parameters object defining sketch size and render resolution
   * @param seed RNG seed (useful for recreating state of another sketch object)
   */
  constructor(
    private sketchFactory: SketchFactory,
    public readonly renderer: SketchRenderer<ICanvas>,
    params: SizeParams,
    seed?: number[]
  ) {
    this.params = { resolution: 1, ...params }
    this.seed = seed || createEntropy()
    this.mersenneTwister = MersenneTwister.seedWithArray(this.seed)
    this.random = new Random(this.mersenneTwister)
  }

  /**
   * Wrapper for sketch update function
   * @returns underlying sketch instance's update function
   */
  get update() {
    return this.sketch?.update
  }

  /**
   * Render this sketch
   */
  render() {
    const sketch = this.sketch || this.runFactory()
    // TODO: Remove once proper framework abstraction in SketchRenderer is supported
    if (sketch.container.getChildAt(0).visible) {
      this.renderer.render(sketch, this.params)
    }
    this.sketch = sketch
  }

  /**
   * Render this sketch and export render result
   * @param sizeParamsOverrides optional overrides for rendering size params
   * @param format optional image format type to export to
   * @returns renderer's canvas contents as blob
   */
  async export(sizeParamsOverrides?: Partial<SizeParams>, format?: string): Promise<Blob> {
    const currentParams = { ...this.params }
    Object.assign(this.params, sizeParamsOverrides)
    this.render()
    Object.assign(this.params, currentParams)
    const canvas = this.renderer.canvas
    const blobPromise = isHTMLCanvas(canvas)
      ? new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject()), format))
      : canvas.convertToBlob({ type: format })
    return await blobPromise
  }

  /** Generate new sketch instance */
  next() {
    this.destroy()
    // We store how many random values were generated so far, so that when canvas is resized we could
    // "replay" RNG from this point
    this.randomUseCount = this.mersenneTwister.getUseCount()
    this.sketch = this.runFactory()
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
      this.sketch = this.runFactory()
    }
  }

  /** Destroy current sketch container and free associated memory */
  private destroy() {
    this.sketch?.container.destroy(true)
    this.sketch = undefined
  }

  /**
   * Method to generate new sketch instance
   * @returns sketch instance with wrapped container
   */
  private runFactory(): SketchInstance {
    const renderer = this.renderer.renderer
    const random = this.random
    const { width, height } = this.params
    // Calculate bounding box
    const bbox = box(-width / 2, -height / 2, width / 2, height / 2)

    const newSketch = this.sketchFactory({ renderer, random, bbox })
    const container = newSketch.container

    // Set transform matrix to translate (0, 0) to the viewport center and point Y-axis upwards
    newSketch.container = new Container().setTransform(width / 2, height / 2, 1, -1)
    newSketch.container.addChild(container)
    return newSketch
  }
}
