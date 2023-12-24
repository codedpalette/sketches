import { box } from "@flatten-js/core"
import { Container, Renderer } from "pixi.js"
import { createEntropy, MersenneTwister19937 as MersenneTwister } from "random-js"

import { Random } from "./random"
import { RenderParams, SizeParams, SketchFactory, SketchInstance, SketchParams } from "./types"
import { UI } from "./ui"

export const defaultSizeParams: SizeParams = { resolution: 1, width: 1250, height: 1250 }
const defaultRenderParams: RenderParams = { antialias: true, resizeCSS: true, scaleBbox: false, clickable: true }
const recordingFPS = 60 // Used for canvas-capture recorder to count seconds of recording

/** Class that encapsulates all aspects of running a sketch that are separate from an actual artwork code */
export class Sketch {
  /** Canvas that this sketch renders to */
  public readonly canvas: HTMLCanvasElement
  /** Seed for initializing random generator */
  private readonly randomSeed = createEntropy()
  /** Using [Mersenne twister](http://en.wikipedia.org/wiki/Mersenne_twister) algorithm for repeatability */
  private mersenneTwister = MersenneTwister.seedWithArray(this.randomSeed)
  /** RNG instance */
  private random = new Random(this.mersenneTwister)
  /** RNG use count (for repeatability of random numbers) */
  private randomUseCount = 0

  /** Pixi.js {@link Renderer} */
  private renderer: Renderer
  /** {@link UI} system */
  private ui?: Partial<UI>
  /** Current sketch instance */
  private sketch?: SketchInstance
  /** Sketch parameters */
  private params: SketchParams

  /** First recorded timestamp (in milliseconds) */
  private startTime = 0
  /** Previous recorded timestamp (in milliseconds) */
  private prevTime = 0
  /** How many frames have passed since the beginning of a video recording */
  private frameRecordCounter = 0
  /** Current animation frame request id */
  private requestId?: number
  /** Is canvas clickable */
  private _clickable = false
  /** Reference to click event listener */
  private clickEventListener

  /**
   * Create a new sketch instance
   * @param {SketchFactory} sketchFactory function returning {@link SketchInstance} instance for given environment
   * @param {SketchParams} params sketch parameters
   */
  constructor(private sketchFactory: SketchFactory, params?: Partial<SketchParams>) {
    const canvasSizeParams = params?.view && { width: params.view.clientWidth, height: params.view.clientHeight }
    this.params = {
      ...defaultSizeParams,
      ...defaultRenderParams,
      ...canvasSizeParams,
      ...params,
    }
    // Initialize Pixi.js WebGL renderer
    this.renderer = new Renderer({
      ...this.params,
      autoDensity: this.params.resizeCSS,
    })
    this.canvas = this.renderer.view as HTMLCanvasElement
    this.clickEventListener = () => this.nextSketch()
    this.clickable = this.params.clickable
    this.runFactory()
  }

  /** Is clicking to generate new sketch instance enabled */
  get clickable() {
    return this._clickable
  }
  /** Set to enable/disable clicking to generate new sketch instance */
  set clickable(value) {
    this._clickable = value
    if (value) {
      this.canvas.addEventListener("click", this.clickEventListener)
      this.canvas.addEventListener("touchend", this.clickEventListener)
    } else {
      this.canvas.removeEventListener("click", this.clickEventListener)
      this.canvas.removeEventListener("touchend", this.clickEventListener)
    }
  }

  /**
   * Render a sketch and run update loop if necessary
   * @param {UI} ui UI system for this sketch
   */
  run(ui?: Partial<UI>) {
    this.ui = ui || this.ui
    !this.canvas.isConnected && document.body.appendChild(this.canvas.parentElement || this.canvas)
    if (this.sketch?.update || this.ui?.stats) {
      this.renderLoop()
    } else {
      this.sketch?.container && this.renderer.render(this.sketch.container)
    }
  }

  /** Stop update loop and reset timer */
  stop() {
    this.startTime = this.prevTime = this.frameRecordCounter = 0
    this.requestId && cancelAnimationFrame(this.requestId)
  }

  /**
   * Resize renderer
   * @param {SizeParams} params New size parameters for this sketch
   */
  resize(params: SizeParams) {
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

    // When resizing sketch we want RNG to repeat the same values
    // Which is why we need to recreate the state that was prior to last sketch run
    this.mersenneTwister = MersenneTwister.seedWithArray(this.randomSeed).discard(this.randomUseCount)
    this.random = new Random(this.mersenneTwister)
    this.runFactory()
  }

  /** Generate new sketch instance when user clicks on a canvas */
  private nextSketch() {
    this.stop()
    // We store how many random values were generated so far, so that when canvas is resized we could
    // "replay" RNG from this point
    this.randomUseCount = this.mersenneTwister.getUseCount()
    this.runFactory()
    this.run()
  }

  /** Method to replace current sketch instance with a new one */
  private runFactory() {
    // Destroy current sketch container and free associated memory
    this.sketch?.container.destroy(true)

    const renderer = this.renderer
    const random = this.random
    const {
      screen: { width, height },
      resolution,
    } = renderer
    const bboxScale = this.params.scaleBbox ? resolution : 1
    // Calculate bounding box
    const bbox = box(-width / 2, -height / 2, width / 2, height / 2).scale(bboxScale, bboxScale)

    const newSketch = this.sketchFactory({ renderer, random, bbox })
    const container = newSketch.container
    container.interactiveChildren = false // disables hit testing (increases performance)

    // Set transform matrix to translate (0, 0) to the viewport center and point Y-axis upwards
    newSketch.container = new Container().setTransform(width / 2, height / 2, 1 / bboxScale, -1 / bboxScale)
    newSketch.container.addChild(container)
    this.sketch = newSketch
  }

  /**
   * Start render loop. Also counts elapsed time to pass it to the {@link SketchInstance.update} function and
   * checks if {@link https://github.com/amandaghassaei/canvas-capture CanvasCapture} is recording
   */
  private renderLoop() {
    const loop = (timestamp: number) => {
      this.ui?.stats?.begin()
      this.updateTime(timestamp)
      this.sketch?.container && this.renderer.render(this.sketch.container)
      this.checkRecording()
      this.ui?.stats?.end()
      this.requestId = requestAnimationFrame(loop)
    }
    this.requestId = requestAnimationFrame(loop)
  }

  /**
   * Calculates delta time between frames and total elapsed time, passes it to the sketch's update function (if defined)
   * @param timestamp current timestamp (in milliseconds)
   */
  private updateTime(timestamp: number) {
    // If startTime isn't set - set it to the current timestamp
    !this.startTime && (this.startTime = timestamp)
    const totalSeconds = (timestamp - this.startTime) / 1000
    const deltaSeconds = (timestamp - (this.prevTime || this.startTime)) / 1000
    this.prevTime = timestamp
    this.sketch?.update && this.sketch.update(totalSeconds, deltaSeconds)
  }

  /**
   * Renders sketch as PNG/MP4 file. For more information see {@link https://github.com/amandaghassaei/canvas-capture#use}
   */
  private checkRecording() {
    this.ui?.capture?.checkHotkeys()
    if (this.ui?.capture?.isRecording()) {
      this.ui?.capture?.recordFrame()
      ++this.frameRecordCounter % recordingFPS == 0 &&
        console.log(`Recorded ${this.frameRecordCounter / recordingFPS} seconds`)
    } else if (this.frameRecordCounter != 0) this.frameRecordCounter == 0
  }
}
