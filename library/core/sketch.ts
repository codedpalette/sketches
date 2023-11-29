import { Box, box } from "@flatten-js/core"
import { CanvasCapture } from "canvas-capture"
import { initUI } from "core/ui"
import { Container, Renderer } from "pixi.js"
import { Random } from "random"
import { createEntropy, MersenneTwister19937 as MersenneTwister } from "random-js"
import Stats from "stats.js"

const recordingFPS = 60 // Used for canvas-capture recorder to count seconds of recording
const defaultParams: SketchParams = { resolution: 1, width: 1262, height: 1262 }

export interface SketchParams {
  readonly width: number // Renderer's view width
  readonly height: number // Renderer's view height
  readonly resolution: number // Renderer's pixel ratio
}

export interface SketchEnv {
  renderer: Renderer
  random: Random
  bbox: Box
}

export type UpdateFn = (totalTime: number, deltaTime: number) => void
export type Sketch = { container: Container; update?: UpdateFn }
export type SketchFactory = (env: SketchEnv) => Sketch

/**
 * Render a sketch and run update loop. Encapsulates all the necessary state initialization
 * @param sketchFactory function returning {@link Sketch} instance for given {@link SketchEnv}
 * @param [view] canvas element instance to render to, if omitted will create a new one and add it to page
 */
export function run(sketchFactory: SketchFactory, view?: HTMLCanvasElement) {
  // Initialize object to hold current sketch instance
  // Fields will be updated from user's interaction
  const sketch = { container: new Container() } as Sketch
  sketch.container.interactiveChildren = false // disables hit testing (increases performance)

  // Initialize random number generator
  const randomSeed = createEntropy()
  // Using [Mersenne twister](http://en.wikipedia.org/wiki/Mersenne_twister) algorithm for repeatability
  let mersenneTwister = MersenneTwister.seedWithArray(randomSeed)
  let random = new Random(mersenneTwister)
  let randomUseCount = 0

  // Initialize Pixi.js WebGL renderer
  const renderer = new Renderer({
    ...defaultParams,
    view,
    antialias: true,
    autoDensity: true, // To resize canvas CSS dimensions automatically when resizing renderer
  })
  const canvas = renderer.view as HTMLCanvasElement
  !canvas.isConnected && document.body.appendChild(canvas)

  // Closure to replace current sketch instance with a new one
  const runFactory = () => {
    // Calculate new SketchParams (if renderer was resized)
    const params = { width: renderer.screen.width, height: renderer.screen.height, resolution: renderer.resolution }
    // Calculate bounding box
    const bbox = box(-params.width / 2, -params.height / 2, params.width / 2, params.height / 2)
    const { container, update } = sketchFactory({ renderer, random, bbox })

    // Destroy current sketch container and free associated memory
    sketch.container.removeChildren().forEach((obj) => obj.destroy(true))
    // Set transform matrix to translate (0, 0) to the viewport center and point Y-axis upwards
    sketch.container.setTransform(params.width / 2, params.height / 2, 1, -1).addChild(container)
    sketch.update = update
  }
  runFactory()

  // Generate new sketch instance when user clicks on a canvas.
  // We store how many random values were generated so far, so that when canvas is resized we could
  // "replay" RNG from this point
  const nextSketch = () => {
    randomUseCount = mersenneTwister.getUseCount()
    runFactory()
    resetClock()
  }
  canvas.onclick = nextSketch

  // When resizing sketch we want RNG to repeat the same values
  // Which is why we need to recreate the state that was prior to last sketch run
  const resizeSketch = () => {
    mersenneTwister = MersenneTwister.seedWithArray(randomSeed).discard(randomUseCount)
    random = new Random(mersenneTwister)
    runFactory()
  }
  const stats = process.env.NODE_ENV !== "production" ? initUI(defaultParams, renderer, resizeSketch) : undefined

  // Start render loop
  const resetClock = renderLoop(renderer, sketch, stats)
}

/**
 * Start render loop. Also counts elapsed time to pass it to the {@link Sketch.update} function and
 * checks if {@link https://github.com/amandaghassaei/canvas-capture CanvasCapture} is recording
 * @param renderer Pixi.js WebGL renderer
 * @param sketch object holding current sketch instance
 * @param [stats] {@link https://github.com/mrdoob/stats.js Stats.js} object for displaying performance charts
 * @returns closure to reset clock, used whenever sketch instance is recreated
 */
function renderLoop(renderer: Renderer, sketch: Sketch, stats?: Stats) {
  const timer = {
    startTime: 0, // First recorded timestamp (in milliseconds)
    prevTime: 0, // Previous recorded timestamp (in milliseconds)
    frameRecordCounter: 0, // How many frames have passed since the beginning of a video recording
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

/**
 * Calculates delta time between frames and total elapsed time, passes it to the sketch's update function (if defined)
 * @param timestamp current timestamp (in milliseconds)
 * @param timer object holding first and previous timestamps
 * @param [update] sketch's update function (if defined)
 */
function updateTime(timestamp: number, timer: { startTime: number; prevTime: number }, update?: UpdateFn) {
  // If startTime isn't set - set it to the current timestamp
  !timer.startTime && (timer.startTime = timestamp)
  const totalSeconds = (timestamp - timer.startTime) / 1000
  const deltaSeconds = (timestamp - (timer.prevTime || timer.startTime)) / 1000
  timer.prevTime = timestamp
  update && update(totalSeconds, deltaSeconds)
}

/**
 * Renders sketch as PNG/MP4 file. For more information see {@link https://github.com/amandaghassaei/canvas-capture#use}
 * @param timer object holding current recording's frame count
 */
function checkRecording(timer: { frameRecordCounter: number }) {
  CanvasCapture.checkHotkeys()
  if (CanvasCapture.isRecording()) {
    CanvasCapture.recordFrame()
    ++timer.frameRecordCounter % recordingFPS == 0 &&
      console.log(`Recorded ${timer.frameRecordCounter / recordingFPS} seconds`)
  } else if (timer.frameRecordCounter != 0) timer.frameRecordCounter == 0
}
