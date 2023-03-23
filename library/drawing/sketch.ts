import { Application, Container, Ticker } from "pixi.js";
import { AxesHelper, Camera, Clock, GridHelper, Scene, WebGLRenderer } from "three";
import { drawAxes } from "./pixi";
import { getWebGL2ErrorMessage, isWebGL2Available } from "./webgl";
import Stats, { Panel } from "stats.js";
import { max, round } from "mathjs";
import { CanvasCapture } from "canvas-capture";

export interface SketchParams {
  debug: boolean;
  width: number;
  height: number;
  bgColor: string | number;
}

export interface PixiSketch {
  container: Container;
  update?: (deltaTime: number, elapsedTotal: number) => void;
}

export interface ThreeSketch {
  scene: Scene;
  camera: Camera;
  update?: (deltaTime: number, elapsedTotal: number) => void;
}

type Sketch = PixiSketch | ThreeSketch;
type SketchContext<T extends Sketch> = T extends PixiSketch ? Application : WebGLRenderer;
const FPS = 60;

export function init(params?: Partial<SketchParams>): SketchParams {
  const defaultParams: SketchParams = {
    debug: false,
    width: 1080,
    height: 1080,
    bgColor: "white",
  };
  return { ...defaultParams, ...params };
}

export function run(sketch: Sketch, params: SketchParams) {
  const stats = params.debug && sketch.update ? new Stats() : undefined;
  stats?.showPanel(0);
  stats && document.body.appendChild(stats.dom);

  const [canvas, ctx] = getCanvasAndContext(sketch, params);
  document.body.appendChild(canvas);
  runSketch(sketch, params, ctx, stats);
}

export function capture(seconds: number, sketch: Required<Sketch>, params: SketchParams) {
  const [canvas, ctx] = getCanvasAndContext(sketch, params);
  document.body.appendChild(canvas);
  CanvasCapture.init(canvas, { showRecDot: true });

  const maxFrames = seconds * FPS;
  let frameCounter = 0;
  const update = sketch.update;
  sketch.update = (deltaTime: number, elapsedTotal: number) => {
    update(deltaTime, elapsedTotal);
    if (CanvasCapture.isRecording()) {
      CanvasCapture.recordFrame();
      frameCounter++;
      if (frameCounter % FPS == 0) console.log(`Recorded ${frameCounter / FPS}/${seconds} seconds`);
      if (frameCounter == maxFrames) void CanvasCapture.stopRecord();
    }
  };

  runSketch(sketch, { ...params, debug: false }, ctx);
  CanvasCapture.beginVideoRecord({
    onExportProgress: (progress) => console.log(`Processing recording, ${round(progress * 100)}%...`),
  });
}

function getCanvasAndContext<T extends Sketch>(sketch: T, params: SketchParams): [HTMLCanvasElement, SketchContext<T>] {
  if (isPixiSketch(sketch)) {
    const app = new Application({
      width: params.width,
      height: params.height,
      backgroundColor: params.bgColor,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    const canvas = app.view as HTMLCanvasElement;
    return [canvas, app as SketchContext<T>];
  } else {
    const renderer = new WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    const canvas = renderer.domElement;
    renderer.setSize(params.width, params.height);
    return [canvas, renderer as SketchContext<T>];
  }
}

function runSketch<T extends Sketch>(sketch: T, params: SketchParams, ctx: SketchContext<T>, stats?: Stats) {
  if (isPixiSketch(sketch)) runPixiSketch(sketch, params, ctx as Application, stats);
  else runThreeSketch(sketch, params, ctx as WebGLRenderer, stats);
}

function runPixiSketch(sketch: PixiSketch, params: SketchParams, app: Application, stats?: Stats) {
  const ticker = Ticker.shared;
  ticker.autoStart = false;

  const mainContainer = new Container();
  mainContainer.position = { x: params.width / 2, y: params.height / 2 };
  mainContainer.scale.set(1, -1);
  mainContainer.addChild(sketch.container);
  if (params.debug) mainContainer.addChild(drawAxes(params));

  app.stage.addChild(mainContainer);
  if (sketch.update) {
    let totalElapsed = 0;
    const update = sketch.update;
    const render = (timeMs: number) => {
      stats?.begin();
      ticker.update(timeMs);
      app.renderer.render(app.stage);

      const deltaSeconds = ticker.deltaMS / 1000;
      totalElapsed += deltaSeconds;
      update(deltaSeconds, totalElapsed);
      requestAnimationFrame(render);

      stats?.end();
    };
    render(performance.now());
  }
}

function runThreeSketch(sketch: ThreeSketch, params: SketchParams, renderer: WebGLRenderer, stats?: Stats) {
  const clock = new Clock(true);
  let maxDrawCalls = 0;

  const drawCallsPanel = new Panel("DrawCalls", "lightgreen", "darkgreen");
  stats?.addPanel(drawCallsPanel);

  if (params.debug) sketch.scene.add(new AxesHelper(), new GridHelper());
  const render = () => {
    stats?.begin();
    renderer.render(sketch.scene, sketch.camera);

    const frameDrawCalls = renderer.info.render.calls;
    maxDrawCalls = max(frameDrawCalls, maxDrawCalls);
    drawCallsPanel.update(frameDrawCalls, maxDrawCalls);

    if (sketch.update) {
      sketch.update(clock.getDelta(), clock.elapsedTime);
      requestAnimationFrame(render);
    }
    stats?.end();
  };

  isWebGL2Available() ? render() : document.body.appendChild(getWebGL2ErrorMessage(params.width));
}

function isPixiSketch(sketch: Sketch): sketch is PixiSketch {
  return (<PixiSketch>sketch).container !== undefined;
}
