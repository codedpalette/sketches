import { Renderer } from "./renderer"
import { PixiSketch } from "./sketch"

export class Runner {
  private runningSketch: PixiSketch | null = null
  private requestId?: number
  constructor(private renderer: Renderer) {}

  start(sketch: PixiSketch) {
    this.runningSketch = sketch
    this.renderer.render(sketch)
    this.toggleListeners(true)
    this.renderLoop()
    // if (this.params.update && (this.sketch.update || this.params.ui)) {
    //   this.renderLoop()
    // }
  }

  private renderLoop() {
    const loop = (timestamp: number) => {
      //this.params.ui?.stats?.begin()
      //this.updateTime(timestamp)
      this.runningSketch && this.renderer.render(this.runningSketch)
      //this.checkRecording()
      //this.params.ui?.stats?.end()
      this.requestId = requestAnimationFrame(loop)
    }
    this.requestId = requestAnimationFrame(loop)
  }

  private clickListener = (ev: Event) => {
    ev.stopPropagation()
    //this.params.click && this.params.click(ev)
    this.nextSketch()
  }

  private toggleListeners(add: boolean) {
    const event = "click"
    //if (this.params.click) {
    const canvas = this.renderer.canvas
    add ? canvas.addEventListener?.(event, this.clickListener) : canvas.removeEventListener?.(event, this.clickListener)
    //}
  }

  private nextSketch() {
    this.runningSketch && this.runningSketch.next()
  }
}
