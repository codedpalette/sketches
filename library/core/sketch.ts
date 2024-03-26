import { box } from "@flatten-js/core"
import { ICanvas } from "pixi.js"
import { createEntropy, MersenneTwister19937 as MersenneTwister } from "random-js"

import { Random } from "./random"
import { PixiRenderer } from "./renderer"
import { SizeParams, SketchCreator, SketchInstance, SketchParams, SketchType, UpdateFn } from "./types"

export interface SketchConstructor {
  <T extends ICanvas>(renderer: PixiRenderer<T>, params: SketchParams): SketchLike<T>
}

export interface SketchLike<T extends ICanvas> {
  update?: UpdateFn
  canvas: T
  render(): void
  next(): void
  resize(params: Partial<SizeParams>): void
}

/** Class for wrapping sketch and controlling RNG state */
export class Sketch<T extends SketchType, C extends ICanvas> implements SketchLike<C> {
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
    private renderer: PixiRenderer<C>,
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
   */
  get update() {
    return this.instance?.update
  }

  /**
   * Canvas that this sketch renders to
   * @returns canvas
   */
  get canvas() {
    return this.renderer.canvas
  }

  /**
   * Render this sketch
   */
  render() {
    const instance = this.instance || this.iterate()
    // FIXME: Remove once proper framework abstraction in SketchRenderer is supported
    if ("container" in instance && instance.container.visible) {
      this.renderer.render(instance, this.params)
    }
    this.instance = instance
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
    const blobPromise =
      canvas.convertToBlob?.({ type: format }) ||
      new Promise((resolve, reject) => canvas.toBlob?.((blob) => (blob ? resolve(blob) : reject()), format) || reject())
    return await blobPromise
  }

  /** Generate new sketch instance */
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
    const newSketch = this.sketchCreator({ random, bbox, ...this.renderer.getRenderingContext(this.type) })
    return newSketch
  }

  /** Destroy current sketch container and free associated memory */
  private destroy() {
    this.instance && "container" in this.instance && this.instance.container.destroy(true)
    this.instance = undefined
  }
}

/**
 * Helper method to define Pixi.js sketch
 * @param sketchCreator function producing new sketch instances
 * @returns function that creates Pixi.js sketch with given params
 */
export function pixi(sketchCreator: SketchCreator<"pixi">): SketchConstructor {
  return (renderer, params) => new Sketch("pixi", sketchCreator, renderer, params)
}
