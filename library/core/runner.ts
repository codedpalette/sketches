import { Sketch } from "./sketch"
import { RunnerParams } from "./types"
import { UI } from "./ui"

const recordingFPS = 60 // Used for canvas-capture recorder to count seconds of recording

const defaultRunnerParams: RunnerParams = {
  click: () => {},
  update: true,
}

/** Class for controlling render loop */
export class SketchRunner {
  /** First recorded timestamp (in milliseconds) */
  private startTime = 0
  /** Previous recorded timestamp (in milliseconds) */
  private prevTime = 0
  /** How many frames have passed since the beginning of a video recording */
  private frameRecordCounter = 0
  /** Current animation frame request id */
  private requestId?: number
  /** Runner params */
  private params: RunnerParams

  /**
   * @param sketch sketch to run
   * @param params parameters overrides for this runner
   * @param ui UI system object
   */
  constructor(public readonly sketch: Sketch, params?: Partial<RunnerParams>, private ui?: UI) {
    this.params = { ...defaultRunnerParams, ...params }
  }

  /**
   * Start render loop. Also counts elapsed time to pass it to the {@link SketchInstance.update} function and
   * checks if {@link https://github.com/amandaghassaei/canvas-capture CanvasCapture} is recording
   */
  start() {
    this.sketch.render()
    this.toggleListeners(true)
    if (this.params.update && (this.sketch.update || this.ui)) {
      this.renderLoop()
    }
  }

  /** Stop update loop and reset timer */
  stop() {
    this.startTime = this.prevTime = this.frameRecordCounter = 0
    this.requestId && cancelAnimationFrame(this.requestId)
    this.toggleListeners(false)
  }

  private clickListener = (ev: Event) => {
    ev.stopPropagation()
    this.params.click && this.params.click(ev)
    this.nextSketch()
  }

  private toggleListeners(add: boolean) {
    const event = "click"
    if (this.params.click) {
      const canvas = this.sketch.renderer.canvas
      add ? canvas.addEventListener(event, this.clickListener) : canvas.removeEventListener(event, this.clickListener)
    }
  }

  /** Generate new sketch instance when user clicks on a canvas */
  private nextSketch() {
    this.stop()
    this.sketch.next()
    this.start()
  }

  private renderLoop() {
    const loop = (timestamp: number) => {
      this.ui?.stats?.begin()
      this.updateTime(timestamp)
      this.sketch.render()
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
    this.sketch.update?.(totalSeconds, deltaSeconds)
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
