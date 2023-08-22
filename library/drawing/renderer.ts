import "utils/random"

import { CanvasCapture } from "canvas-capture"
import { round } from "mathjs"
import { MersenneTwister19937, Random } from "random-js"
import Stats from "stats.js"

export interface SketchParams {
  debug: boolean
  width: number
  height: number
  pixelDensity: number //TODO: Implement
}

export interface SketchEnv {
  gl: WebGL2RenderingContext
  random: Random
  params: SketchParams
}

export type SketchRender = (deltaTime: number, totalTime: number) => void
export type SketchFactory = (env: SketchEnv) => SketchRender

export function run(sketchFactory: SketchFactory, paramsOverrides?: Partial<SketchParams>) {
  const stats = process.env.NODE_ENV !== "production" ? new Stats() : undefined
  stats && document.body.appendChild(stats.dom)

  const params = setDefaultParams(paramsOverrides)
  const canvas = initCanvas(params)
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: true }) as WebGL2RenderingContext
  const random = new Random(MersenneTwister19937.autoSeed())

  const sketch = { render: sketchFactory({ gl, random, params }) }
  const resetClock = renderLoop(sketch, gl, stats)
  canvas.onclick = () => {
    sketch.render = sketchFactory({ gl, random, params })
    resetClock()
  }

  //TODO: Resize with the same random seed
}

function renderLoop(sketch: { render: SketchRender }, gl: WebGL2RenderingContext, stats?: Stats) {
  let [startTime, prevTime, frameRecordCounter] = [0, 0, 0]
  const loop = (timestamp: number) => {
    stats?.begin()

    !startTime && (startTime = timestamp)
    const totalTime = (timestamp - startTime) / 1000
    const deltaTime = (timestamp - (prevTime || startTime)) / 1000
    prevTime = timestamp

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
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
  canvas.width = params.width
  canvas.height = params.height
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
