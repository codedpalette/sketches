import { box } from "@flatten-js/core"
import { Container } from "pixi.js"
import { createEntropy, MersenneTwister19937 as MersenneTwister } from "random-js"

import { Random } from "./random"
import { SketchRenderer } from "./renderer"
import { SizeParams, SketchFactory, SketchInstance } from "./types"

/** Class for wrapping sketch and controlling RNG state */
export class Sketch implements SketchInstance {
  /** Sketch size parameters */
  public readonly params: Required<SizeParams>
  /** Seed for initializing random generator */
  private readonly randomSeed = createEntropy()
  /** Using [Mersenne twister](http://en.wikipedia.org/wiki/Mersenne_twister) algorithm for repeatability */
  private mersenneTwister = MersenneTwister.seedWithArray(this.randomSeed)
  /** RNG instance */
  private random = new Random(this.mersenneTwister)
  /** RNG use count (for repeatability of random numbers) */
  private randomUseCount = 0
  /** Current sketch instance */
  private sketch: SketchInstance

  constructor(private sketchFactory: SketchFactory, public readonly renderer: SketchRenderer, params: SizeParams) {
    this.params = { resolution: 1, ...params }
    this.sketch = this.runFactory()
  }

  get container() {
    return this.sketch.container
  }

  get update() {
    return this.sketch.update
  }

  /**
   * Render this sketch and optionally copy results to another canvas
   * @param copyTo Canvas element to copy render results to
   */
  render(copyTo?: HTMLCanvasElement) {
    this.renderer.render(this)
    if (copyTo) {
      const ctx = copyTo.getContext("2d")
      ctx?.drawImage(this.renderer.canvas, 0, 0)
    }
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
  resize(params: SizeParams) {
    this.destroy()
    Object.assign(this.params, params)
    // When resizing sketch we want RNG to repeat the same values
    // Which is why we need to recreate the state that was prior to last sketch run
    this.mersenneTwister = MersenneTwister.seedWithArray(this.randomSeed).discard(this.randomUseCount)
    this.random = new Random(this.mersenneTwister)
    this.sketch = this.runFactory()
  }

  /** Destroy current sketch container and free associated memory */
  private destroy() {
    this.sketch.container.destroy(true)
  }

  /** Method to generate new sketch instance */
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
