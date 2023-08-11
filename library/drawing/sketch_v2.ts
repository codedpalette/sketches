import "utils/random"

import { CanvasCapture } from "canvas-capture"
import { round } from "mathjs"
import { MersenneTwister19937, Random } from "random-js"
import Stats from "stats.js"

export interface SketchParams {
  debug: boolean
  width: number
  height: number
  pixelDensity: number
}

export interface SketchEnv {
  gl: WebGL2RenderingContext
  random: Random
  params: SketchParams
}

export type SketchRender = (deltaTime: number, totalTime: number) => void
export type Sketch = (env: SketchEnv) => SketchRender

export function run(sketch: Sketch, paramsOverrides?: Partial<SketchParams>) {
  const stats = process.env.NODE_ENV !== "production" ? new Stats() : undefined
  stats && document.body.appendChild(stats.dom)

  const params = setDefaultParams(paramsOverrides)
  const canvas = initCanvas(params)
  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext
  const random = new Random(MersenneTwister19937.autoSeed())

  let [startTime, prevTime, frameRecordCounter] = [0, 0, 0]
  let sketchRender = sketch({ gl, random, params })
  const loop = (timestamp: number) => {
    stats?.begin()

    !startTime && (startTime = timestamp)
    const totalTime = (timestamp - startTime) / 1000
    const deltaTime = (timestamp - (prevTime || startTime)) / 1000
    prevTime = timestamp

    sketchRender(deltaTime, totalTime)
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

  canvas.onclick = () => {
    sketchRender = sketch({ gl, random, params })
    startTime = 0
    prevTime = 0
  }
}

function initCanvas(params: SketchParams): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.id = canvasId
  canvas.width = params.width
  canvas.height = params.height
  document.body.appendChild(canvas)

  CanvasCapture.init(canvas, { showRecDot: true })
  CanvasCapture.bindKeyToPNGSnapshot("p")
  CanvasCapture.bindKeyToVideoRecord("v", {
    onExportProgress: (progress) => console.log(`Processing recording, ${round(progress * 100)}%...`),
  })
  return canvas
}

function setDefaultParams(paramsOverrides?: Partial<SketchParams>): SketchParams {
  const defaultParams = { debug: false, pixelDensity: 1 }
  const devDimensions = { width: 1300, height: 1300 }
  const prodDimensions = { width: window.innerWidth, height: window.innerHeight }
  const dimensions = process.env.NODE_ENV === "production" ? prodDimensions : devDimensions
  return { ...defaultParams, ...dimensions, ...paramsOverrides }
}

const canvasId = "sketch"
const FPS = 60
