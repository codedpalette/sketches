import "@pixi/unsafe-eval"

import { CanvasCapture } from "canvas-capture"
import { Path, Rectangle } from "geometry/paths"
import { max, min, round } from "mathjs"
import { Application, Container } from "pixi.js"
import Stats, { Panel } from "stats.js"
import { AxesHelper, Camera, GridHelper, Scene, WebGLRenderer } from "three"

import { drawAxes } from "./pixi"

export interface SketchParams {
  debug: boolean
  width: number
  height: number
  resolution: number
}

export interface PixiSketch {
  container: Container
  update?: (deltaTime: number, elapsedTotal: number) => void
}

export interface ThreeSketch {
  scene: Scene
  camera: Camera
  update?: (deltaTime: number, elapsedTotal: number) => void
}

interface SketchContext<T extends Sketch> {
  canvas: HTMLCanvasElement
  context: T extends PixiSketch ? Application<HTMLCanvasElement> : WebGLRenderer
  resize: (params: SketchParams) => void
  run: (sketch: T) => void
  render: () => void
}

type Sketch = PixiSketch | ThreeSketch
type SketchFactory<T extends Sketch> = (params: SketchParams) => T
const FPS = 60

export const Params = {
  DEBUG: {
    debug: true,
  },
  PRINTIFY: {
    width: 960,
    height: 1200,
    resolution: 5,
  },
}

export function run<T extends Sketch>(sketchFactory: SketchFactory<T>, paramsOverrides?: Partial<SketchParams>) {
  const stats = process.env.NODE_ENV === "production" ? undefined : initStats()
  const params = setDefaultParams(paramsOverrides)
  const sketch = sketchFactory(params)
  const context = initSketchContext(sketch, params, stats)
  context.run(sketch)

  let totalElapsed = 0
  let frameRecordCounter = 0
  let needsUpdate = true
  let prevTime = 0
  let update = sketch.update
  const renderLoop = (timestamp: number) => {
    stats?.begin()

    let deltaTime = (timestamp - prevTime) / 1000
    prevTime = timestamp

    if (update) {
      while (deltaTime > 0) {
        const timeStep = min(deltaTime, 0.001)
        totalElapsed += timeStep
        deltaTime -= timeStep
        update(timeStep, totalElapsed)
      }
      needsUpdate = true
    }

    needsUpdate && context.render()
    needsUpdate = false

    CanvasCapture.checkHotkeys()
    if (CanvasCapture.isRecording()) {
      CanvasCapture.recordFrame()
      frameRecordCounter++
      if (frameRecordCounter % FPS == 0) console.log(`Recorded ${frameRecordCounter / FPS} seconds`)
    }

    stats?.end()
    requestAnimationFrame(renderLoop)
  }

  requestAnimationFrame(renderLoop)

  context.canvas.onclick = () => {
    const sketch = sketchFactory(params)
    context.run(sketch)
    totalElapsed = 0
    update = sketch.update
  }
  process.env.NODE_ENV === "production" &&
    addEventListener("resize", () => {
      const params = setDefaultParams(paramsOverrides)
      const sketch = sketchFactory(params)
      context.resize(params)
      context.run(sketch)
      totalElapsed = 0
      update = sketch.update
    })
}

function initStats() {
  const stats = new Stats()
  //Array.from(stats.dom.children).forEach((e) => ((e as HTMLCanvasElement).style.display = "block"))
  document.body.appendChild(stats.dom)
  return stats
}

function initSketchContext<T extends Sketch>(sketch: T, params: SketchParams, stats?: Stats): SketchContext<T> {
  const ctx = (isPixiSketch(sketch) ? initPixiSketch(params) : initThreeSketch(params, stats)) as SketchContext<T>

  const canvas = ctx.canvas
  canvas.id = "sketch"
  document.body.appendChild(canvas)
  CanvasCapture.init(canvas, { showRecDot: true })
  CanvasCapture.bindKeyToPNGSnapshot("p")
  CanvasCapture.bindKeyToVideoRecord("v", {
    onExportProgress: (progress) => console.log(`Processing recording, ${round(progress * 100)}%...`),
  })

  ctx.resize(params)
  return ctx
}

function initPixiSketch(params: SketchParams): SketchContext<PixiSketch> {
  const app = new Application<HTMLCanvasElement>({
    antialias: true,
    autoDensity: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  })
  app.stage.scale.set(1, -1)

  return {
    context: app,
    canvas: app.view,
    resize(params) {
      app.renderer.resolution = params.resolution
      app.renderer.resize(params.width, params.height)
      app.stage.position = { x: params.width / 2, y: params.height / 2 }
    },
    run(sketch) {
      const children = app.stage.removeChildren()
      children.forEach((obj) => obj.destroy(true))
      app.stage.addChild(sketch.container)
      params.debug && app.stage.addChild(drawAxes(params))
    },
    render() {
      app.renderer.render(app.stage)
    },
  }
}

function initThreeSketch(params: SketchParams, stats?: Stats): SketchContext<ThreeSketch> {
  const renderer = new WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  })
  const drawCallsPanel = stats?.addPanel(new Panel("DrawCalls", "#ff8", "#221"))

  let maxDrawCalls = 0
  let scene: Scene, camera: Camera
  return {
    context: renderer,
    canvas: renderer.domElement,
    resize(params) {
      renderer.setPixelRatio(params.resolution)
      renderer.setSize(params.width, params.height)
    },
    run(sketch) {
      ;({ scene, camera } = sketch)
      params.debug && scene.add(new AxesHelper(), new GridHelper())
    },
    render() {
      renderer.render(scene, camera)

      const frameDrawCalls = renderer.info.render.calls
      maxDrawCalls = max(frameDrawCalls, maxDrawCalls)
      drawCallsPanel?.update(frameDrawCalls, maxDrawCalls)
    },
  }
}

function setDefaultParams(paramsOverrides?: Partial<SketchParams>): SketchParams {
  const defaultParams = {
    debug: false,
    resolution: 1,
  }
  const dimensions =
    process.env.NODE_ENV === "production"
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 1300, height: 1300 }
  return { ...defaultParams, ...dimensions, ...paramsOverrides }
}

function isPixiSketch(sketch: Sketch): sketch is PixiSketch {
  return (<PixiSketch>sketch).container !== undefined
}

export function getBounds(params: SketchParams): Path {
  return new Rectangle(-params.width / 2, params.height / 2, params.width, -params.height).toPath()
}
