import { Box, box } from "@flatten-js/core"
import { CanvasCapture } from "canvas-capture"
import { initUI } from "core/ui"
import { Container, Renderer } from "pixi.js"
import { createEntropy, MersenneTwister19937 as MersenneTwister } from "random-js"
import Stats from "stats.js"
import { Random } from "utils/random"

const recordingFPS = 60
const defaultParams = { resolution: 1, width: 1262, height: 1262 }

export interface SketchParams {
  readonly width: number
  readonly height: number
  readonly resolution: number
}

export interface SketchEnv {
  renderer: Renderer
  random: Random
  bbox: Box
}

export type UpdateFn = (totalTime: number, deltaTime: number) => void
export type Sketch = { container: Container; update?: UpdateFn }
export type SketchFactory = (env: SketchEnv) => Sketch

export function run(sketchFactory: SketchFactory, view?: HTMLCanvasElement) {
  const sketch = { container: new Container() } as Sketch
  sketch.container.interactiveChildren = false

  const randomSeed = createEntropy()
  let mersenneTwister = MersenneTwister.seedWithArray(randomSeed)
  let random = new Random(mersenneTwister)
  let randomUseCount = 0

  const renderer = new Renderer({
    ...defaultParams,
    view,
    antialias: false,
    autoDensity: true,
    background: "white",
  })
  const canvas = renderer.view as HTMLCanvasElement
  !canvas.isConnected && document.body.appendChild(canvas)

  const runFactory = () => {
    const params = { width: renderer.screen.width, height: renderer.screen.height, resolution: renderer.resolution }
    const bbox = box(-params.width / 2, -params.height / 2, params.width / 2, params.height / 2)
    const { container, update } = sketchFactory({ renderer, random, bbox })

    sketch.container.removeChildren().forEach((obj) => obj.destroy(true))
    sketch.container.setTransform(params.width / 2, params.height / 2, 1, -1).addChild(container)
    sketch.update = update
  }
  runFactory()

  const resizeSketch = () => {
    mersenneTwister = MersenneTwister.seedWithArray(randomSeed).discard(randomUseCount)
    random = new Random(mersenneTwister)
    runFactory()
  }
  const stats = process.env.NODE_ENV !== "production" ? initUI(defaultParams, renderer, resizeSketch) : undefined

  const nextSketch = () => {
    randomUseCount = mersenneTwister.getUseCount()
    runFactory()
    resetClock()
  }
  canvas.onclick = nextSketch

  const resetClock = renderLoop(renderer, sketch, stats)
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
  update && update(totalSeconds, deltaSeconds)
}

function checkRecording(timer: { frameRecordCounter: number }) {
  CanvasCapture.checkHotkeys()
  if (CanvasCapture.isRecording()) {
    CanvasCapture.recordFrame()
    ++timer.frameRecordCounter % recordingFPS == 0 &&
      console.log(`Recorded ${timer.frameRecordCounter / recordingFPS} seconds`)
  } else if (timer.frameRecordCounter != 0) timer.frameRecordCounter == 0
}
