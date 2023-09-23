import { CanvasCapture } from "canvas-capture"
import { initUI } from "drawing/ui"
import { Container, Renderer } from "pixi.js"
import { createEntropy, MersenneTwister19937 } from "random-js"
import Stats from "stats.js"
import { Random } from "utils/random"

export interface SketchParams {
  width: number
  height: number
  resolution: number
}

export interface SketchEnv {
  renderer: Renderer
  random: Random
  params: SketchParams
}

export type UpdateFn = (deltaTime: number, totalTime: number) => void
export type SketchRun = Container | { container: Container; update: UpdateFn }
export type SketchFactory = (env: SketchEnv) => SketchRun

const recordingFPS = 60
const defaultParams = { resolution: 1, width: 1262, height: 1262 }

// TODO: Refactor to classes
export function run(sketchFactory: SketchFactory) {
  let params = defaultParams
  const renderer = new Renderer({
    ...params,
    antialias: true,
    autoDensity: true,
  })
  const canvas = renderer.view as HTMLCanvasElement
  document.body.appendChild(canvas)

  const seed = createEntropy()
  const mt = MersenneTwister19937.seedWithArray(seed)
  const random = new Random(mt)
  let useCount = 0

  const stage = new Container().setTransform(params.width / 2, params.height / 2, 1, -1)
  const sketch = sketchFactory({ renderer, random, params })
  const sketchContainer = "container" in sketch ? sketch.container : sketch
  const update = "update" in sketch ? sketch.update : undefined
  stage.addChild(sketchContainer)

  const resizeSketch = () => {
    params = { width: renderer.screen.width, height: renderer.screen.height, resolution: renderer.resolution }
    const newRandom = new Random(MersenneTwister19937.seedWithArray(seed).discard(useCount))
    const newSketch = sketchFactory({ renderer, random: newRandom, params })
    const newSketchContainer = "container" in newSketch ? newSketch.container : newSketch
    stage.removeChildren().forEach((obj) => obj.destroy(true))
    stage.addChild(newSketchContainer)
    stage.setTransform(params.width / 2, params.height / 2, 1, -1)
  }
  const stats = process.env.NODE_ENV !== "production" ? initUI(params, canvas, renderer, resizeSketch) : undefined
  const resetClock = renderLoop(renderer, stage, update, stats)
  canvas.onclick = () => {
    useCount = mt.getUseCount()
    const newSketch = sketchFactory({ renderer, random, params })
    const newSketchContainer = "container" in newSketch ? newSketch.container : newSketch
    stage.removeChildren().forEach((obj) => obj.destroy(true))
    stage.addChild(newSketchContainer)
    resetClock()
  }
}

function renderLoop(renderer: Renderer, container: Container, update?: UpdateFn, stats?: Stats) {
  let [startTime, prevTime, frameRecordCounter] = [0, 0, 0]
  const loop = (timestamp: number) => {
    stats?.begin()

    !startTime && (startTime = timestamp)
    const totalSeconds = (timestamp - startTime) / 1000
    const deltaSeconds = (timestamp - (prevTime || startTime)) / 1000
    prevTime = timestamp
    update && update(deltaSeconds, totalSeconds)

    renderer.render(container)
    CanvasCapture.checkHotkeys()
    if (CanvasCapture.isRecording()) {
      CanvasCapture.recordFrame()
      frameRecordCounter++
      if (frameRecordCounter % recordingFPS == 0) console.log(`Recorded ${frameRecordCounter / recordingFPS} seconds`)
    } else if (frameRecordCounter != 0) frameRecordCounter == 0

    stats?.end()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  const resetClock = () => (startTime = prevTime = 0)
  return resetClock
}
