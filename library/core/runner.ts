import { Sketch } from "./sketch"
import { RunnerParams } from "./types"
import { UI } from "./ui"

const recordingFPS = 60 // Used for canvas-capture recorder to count seconds of recording

const defaultRunnerParams: RunnerParams = {
  clickable: true,
  updatable: true,
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

  constructor(private sketch: Sketch, private ui?: UI, params?: Partial<RunnerParams>) {
    this.params = { ...defaultRunnerParams, ...params }
    if (this.params.clickable) {
      ;["click", "touchend"].forEach((event) =>
        this.sketch.renderer.canvas.addEventListener(event, () => this.nextSketch())
      )
    }
  }

  /**
   * Render a sketch and run update loop if necessary
   */
  start() {
    if (this.params.updatable && (this.sketch.update || this.ui)) {
      this.renderLoop()
    } else {
      this.sketch.render()
    }
  }

  /** Stop update loop and reset timer */
  stop() {
    this.startTime = this.prevTime = this.frameRecordCounter = 0
    this.requestId && cancelAnimationFrame(this.requestId)
  }

  /** Generate new sketch instance when user clicks on a canvas */
  private nextSketch() {
    this.stop()
    this.sketch.next()
    this.start()
  }

  /**
   * Start render loop. Also counts elapsed time to pass it to the {@link SketchInstance.update} function and
   * checks if {@link https://github.com/amandaghassaei/canvas-capture CanvasCapture} is recording
   */
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
