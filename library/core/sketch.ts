import { Box, box } from "@flatten-js/core"
import { Random } from "library/core/random"
import { UI } from "library/core/ui"
import { Container, IRendererOptions, Renderer } from "pixi.js"
import { createEntropy, MersenneTwister19937 as MersenneTwister } from "random-js"

export type UpdateFn = (totalTime: number, deltaTime: number) => void
export type SketchRun = { container: Container; update?: UpdateFn }
export type SketchEnv = {
  renderer: Renderer // Pixi.js Renderer instance
  random: Random // RNG is passed as a part of env to enable repeatability of random values
  bbox: Box // bounding box of a viewport
}
export type SketchFactory = (env: SketchEnv) => SketchRun
export type RendererOptions = Partial<IRendererOptions> & { view?: HTMLCanvasElement }
export type ResizeOptions = Required<Pick<RendererOptions, "width" | "height" | "resolution">>

export const defaultSizeOptions: ResizeOptions = {
  resolution: 1,
  width: 1250,
  height: 1250,
}
const defaultOptions: RendererOptions = {
  ...defaultSizeOptions,
  antialias: true,
  autoDensity: true, // To resize canvas CSS dimensions automatically when resizing renderer
}
const recordingFPS = 60 // Used for canvas-capture recorder to count seconds of recording

// TODO: Update jsdoc
export class Sketch {
  public readonly canvas: HTMLCanvasElement
  // Initialize random number generator
  private readonly randomSeed = createEntropy()
  // Using [Mersenne twister](http://en.wikipedia.org/wiki/Mersenne_twister) algorithm for repeatability
  private mersenneTwister = MersenneTwister.seedWithArray(this.randomSeed)
  private random = new Random(this.mersenneTwister)
  private randomUseCount = 0

  private renderer: Renderer
  private ui?: Partial<UI>
  private sketch?: SketchRun

  private startTime = 0 // First recorded timestamp (in milliseconds)
  private prevTime = 0 // Previous recorded timestamp (in milliseconds)
  private frameRecordCounter = 0 // How many frames have passed since the beginning of a video recording
  private requestId?: number // Current animation frame request id

  /**
   * Render a sketch and run update loop. Encapsulates all the necessary state initialization
   * @param sketchFactory function returning {@link Sketch} instance for given {@link SketchEnv}
   * @param [view] canvas element instance to render to, if omitted will create a new one and add it to page
   */
  constructor(private sketchFactory: SketchFactory, options?: RendererOptions) {
    const canvasOptions = options?.view && { width: options.view.clientWidth, height: options.view.clientHeight }
    // Initialize Pixi.js WebGL renderer
    this.renderer = new Renderer({
      ...defaultOptions,
      ...canvasOptions,
      ...options,
    })
    this.canvas = this.renderer.view as HTMLCanvasElement
    this.runFactory()
    // TODO: Disable click
    this.canvas.onclick = () => this.nextSketch()
    this.canvas.ontouchend = () => this.nextSketch()
  }

  run(ui?: Partial<UI>) {
    this.ui = ui || this.ui
    !this.canvas.isConnected && document.body.appendChild(this.canvas.parentElement || this.canvas)
    if (this.sketch?.update || this.ui?.stats) {
      this.renderLoop()
    } else {
      this.sketch?.container && this.renderer.render(this.sketch.container)
    }
  }

  stop() {
    this.startTime = this.prevTime = this.frameRecordCounter = 0
    this.requestId && cancelAnimationFrame(this.requestId)
  }

  resize(options: ResizeOptions) {
    this.renderer.resolution = options.resolution
    this.renderer.resize(options.width, options.height)

    // Some browsers have limits for WebGL drawbuffer dimensions. If we set renderer resolution too high,
    // it may cause actual drawbuffer dimensions to be higher than these limits. In order to check for this
    // we compare requested renderer dimensions to actual drawbuffer dimensions, and if they're higher,
    // reset resolution to 1. See for example https://github.com/mrdoob/three.js/issues/5917 for more details.
    const drawBufferWidth = this.renderer.gl.drawingBufferWidth
    const drawBufferHeight = this.renderer.gl.drawingBufferHeight
    if (this.renderer.width > drawBufferWidth || this.renderer.height > drawBufferHeight) {
      this.renderer.resolution = 1
      this.renderer.resize(options.width, options.height)
    }

    // When resizing sketch we want RNG to repeat the same values
    // Which is why we need to recreate the state that was prior to last sketch run
    this.mersenneTwister = MersenneTwister.seedWithArray(this.randomSeed).discard(this.randomUseCount)
    this.random = new Random(this.mersenneTwister)
    this.runFactory()
  }

  private nextSketch() {
    // Generate new sketch instance when user clicks on a canvas.
    // We store how many random values were generated so far, so that when canvas is resized we could
    // "replay" RNG from this point
    this.stop()
    this.randomUseCount = this.mersenneTwister.getUseCount()
    this.runFactory()
    this.run()
  }

  // Method to replace current sketch instance with a new one
  private runFactory() {
    // Destroy current sketch container and free associated memory
    this.sketch?.container.destroy(true)

    const renderer = this.renderer
    const random = this.random
    const { width, height } = renderer.screen
    // Calculate bounding box
    const bbox = box(-width / 2, -height / 2, width / 2, height / 2)

    const newSketch = this.sketchFactory({ renderer, random, bbox })
    const container = newSketch.container
    container.interactiveChildren = false // disables hit testing (increases performance)

    // Set transform matrix to translate (0, 0) to the viewport center and point Y-axis upwards
    newSketch.container = new Container().setTransform(width / 2, height / 2, 1, -1)
    newSketch.container.addChild(container)
    this.sketch = newSketch
  }

  /**
   * Start render loop. Also counts elapsed time to pass it to the {@link Sketch.update} function and
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
