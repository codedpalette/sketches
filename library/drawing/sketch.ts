import { IRandom, Smush32 } from "@thi.ng/random"
import { CanvasCapture } from "canvas-capture"
import Stats from "stats.js"

export interface SketchParams {
  width: number
  height: number
  pixelDensity: number
}

export interface SketchEnv {
  gl: WebGL2RenderingContext
  random: IRandom
}

export type SketchRender = (deltaTime: number, totalTime: number) => void
export type SketchFactory = (env: SketchEnv) => SketchRender

export function run(sketchFactory: SketchFactory, paramsOverrides?: Partial<SketchParams>) {
  const stats = process.env.NODE_ENV !== "production" ? new Stats() : undefined
  stats && document.body.appendChild(stats.dom)

  const params = { ...defaultParams, ...paramsOverrides }
  const canvas = initCanvas(params)
  const gl = canvas.getContext("webgl2", { alpha: false }) as WebGL2RenderingContext
  const random = new Smush32(performance.now())

  const sketch = { render: sketchFactory({ gl, random }) }
  const resetClock = renderLoop(sketch, gl, stats)
  canvas.onclick = () => {
    sketch.render = sketchFactory({ gl, random })
    resetClock()
  }
}

function renderLoop(sketch: { render: SketchRender }, gl: WebGL2RenderingContext, stats?: Stats) {
  let [startTime, prevTime, frameRecordCounter] = [0, 0, 0]
  const loop = (timestamp: number) => {
    stats?.begin()

    !startTime && (startTime = timestamp)
    const totalTime = (timestamp - startTime) / 1000
    const deltaTime = (timestamp - (prevTime || startTime)) / 1000
    prevTime = timestamp

    sketch.render(deltaTime, totalTime)
    CanvasCapture.checkHotkeys()
    if (CanvasCapture.isRecording()) {
      CanvasCapture.recordFrame()
      frameRecordCounter++
      if (frameRecordCounter % FPS == 0) console.log(`Recorded ${frameRecordCounter / FPS} seconds`)
    } else if (frameRecordCounter != 0) frameRecordCounter == 0

    stats?.end()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  return () => (startTime = prevTime = 0)
}

function initCanvas(params: SketchParams): HTMLCanvasElement {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement
  canvas.width = params.width * params.pixelDensity
  canvas.height = params.height * params.pixelDensity
  canvas.style.width = `${params.width}px`
  canvas.style.height = `${params.height}px`

  CanvasCapture.init(canvas, { showRecDot: true })
  CanvasCapture.bindKeyToPNGSnapshot("p")
  CanvasCapture.bindKeyToVideoRecord("v", {
    onExportProgress: (progress) => console.log(`Processing recording, ${Math.round(progress * 100)}%...`),
  })
  return canvas
}

const canvasId = "sketch"
const FPS = 60
const defaultParams = { pixelDensity: 1, width: 1292, height: 1292 }
