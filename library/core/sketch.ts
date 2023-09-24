import { CanvasCapture } from "canvas-capture"
import { initUI } from "core/ui"
import { Container, Renderer } from "pixi.js"
import { createEntropy, MersenneTwister19937 } from "random-js"
import Stats from "stats.js"
import { Random } from "utils/random"

const recordingFPS = 60
const defaultParams = { resolution: 1, width: 1262, height: 1262 }

export interface SketchParams {
  width: number
  height: number
  resolution: number
}

export interface SketchEnv {
  random: Random
  params: SketchParams
}

export type UpdateFn = (deltaTime: number, totalTime: number) => void
export type Sketch = { container: Container; update?: UpdateFn }
export type SketchFactory = (env: SketchEnv) => Container | Sketch

export function run(sketchFactory: SketchFactory, view?: HTMLCanvasElement) {
  const renderer = new Renderer({
    ...defaultParams,
    view,
    antialias: true,
    autoDensity: true,
  })
  let params = defaultParams

  const stage = new Container()
  const canvas = renderer.view as HTMLCanvasElement
  !canvas.isConnected && document.body.appendChild(canvas)

  const randomSeed = createEntropy()
  let mersenneTwister = MersenneTwister19937.seedWithArray(randomSeed)
  let random = new Random(mersenneTwister)
  let randomUseCount = 0

  const runFactory = () => {
    const sketch = sketchFactory({ random, params })
    const container = sketch instanceof Container ? sketch : sketch.container
    const update = sketch instanceof Container ? undefined : sketch.update
    stage.removeChildren().forEach((obj) => obj.destroy(true))
    stage.setTransform(params.width / 2, params.height / 2, 1, -1).addChild(container)
    return { container: stage, update }
  }
  const sketch = runFactory()

  const resizeSketch = () => {
    params = { width: renderer.screen.width, height: renderer.screen.height, resolution: renderer.resolution }
    mersenneTwister = MersenneTwister19937.seedWithArray(randomSeed).discard(randomUseCount)
    random = new Random(mersenneTwister)
    Object.assign(sketch, runFactory()) //TODO: Looks hacky
  }
  const newSketch = () => {
    randomUseCount = mersenneTwister.getUseCount()
    Object.assign(sketch, runFactory()) //TODO: Looks hacky
    resetClock()
  }

  const stats = process.env.NODE_ENV !== "production" ? initUI(params, renderer, resizeSketch) : undefined
  const resetClock = renderLoop(renderer, sketch, stats)
  canvas.onclick = newSketch
}

function renderLoop(renderer: Renderer, sketch: Sketch, stats?: Stats) {
  const timer = {
    startTime: 0,
    prevTime: 0,
    frameRecordCounter: 0,
  }
  const loop = (timestamp: number) => {
    stats?.begin()
    updateTime(timestamp, timer, sketch.update)
    renderer.render(sketch.container)
    checkRecording(timer)
    stats?.end()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  const resetClock = () => (timer.startTime = timer.prevTime = 0)
  return resetClock
}

function updateTime(timestamp: number, timer: { startTime: number; prevTime: number }, update?: UpdateFn) {
  !timer.startTime && (timer.startTime = timestamp)
  const totalSeconds = (timestamp - timer.startTime) / 1000
  const deltaSeconds = (timestamp - (timer.prevTime || timer.startTime)) / 1000
  timer.prevTime = timestamp
  update && update(deltaSeconds, totalSeconds)
}

function checkRecording(timer: { frameRecordCounter: number }) {
  CanvasCapture.checkHotkeys()
  if (CanvasCapture.isRecording()) {
    CanvasCapture.recordFrame()
    ++timer.frameRecordCounter % recordingFPS == 0 &&
      console.log(`Recorded ${timer.frameRecordCounter / recordingFPS} seconds`)
  } else if (timer.frameRecordCounter != 0) timer.frameRecordCounter == 0
}
