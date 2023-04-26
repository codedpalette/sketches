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
type SketchFactory = (params: SketchParams) => Sketch;
const FPS = 60;

export function run(sketchFactory: SketchFactory, paramsOverrides?: Partial<SketchParams>) {
  const params = setDefaultParams(paramsOverrides);
  const sketch = sketchFactory(params);

  const stats = new Stats();
  const panels = new Set(sketch.update ? [0, 2] : [2]);
  for (let i = 0; i < stats.dom.children.length; i++) {
    (stats.dom.children[i] as HTMLCanvasElement).style.display = panels.has(i) ? "block" : "none";
  }
  document.body.appendChild(stats.dom);

  const [ctx, canvas] = isPixiSketch(sketch) ? initPixiSketch(params) : initThreeSketch(params);
  canvas.id = "canvas";
  CanvasCapture.init(canvas, { showRecDot: true });
  CanvasCapture.bindKeyToPNGSnapshot("p");
  CanvasCapture.bindKeyToVideoRecord("v", {
    onExportProgress: (progress) => console.log(`Processing recording, ${round(progress * 100)}%...`),
  });
  let cancel = runSketch(sketch, params, ctx, stats);

  const redraw = () => {
    cancel();
    const sketch = sketchFactory(params);
    cancel = runSketch(sketch, params, ctx, stats);
  };
  canvas.onclick = redraw;
  document.body.appendChild(canvas);
}

function setDefaultParams(params?: Partial<SketchParams>): SketchParams {
  const defaultParams: SketchParams = {
    debug: false,
    width: 1080,
    height: 1080,
  };
  return { ...defaultParams, ...params };
}

function runSketch(sketch: Sketch, params: SketchParams, ctx: Application | WebGLRenderer, stats: Stats) {
  return isPixiSketch(sketch)
    ? runPixiSketch(sketch, params, ctx as Application, stats)
    : runThreeSketch(sketch, params, ctx as WebGLRenderer, stats);
}

function initPixiSketch(params: SketchParams): [Application, HTMLCanvasElement] {
  const app = new Application({
    width: params.width,
    height: params.height,
    background: "white",
    antialias: true,
    preserveDrawingBuffer: true,
  });
  return [app, app.view as HTMLCanvasElement];
}

function runPixiSketch(sketch: PixiSketch, params: SketchParams, app: Application, stats: Stats) {
  const ticker = new Ticker();
  const mainContainer = new Container();
  mainContainer.position = { x: params.width / 2, y: params.height / 2 };
  mainContainer.scale.set(1, -1);
  mainContainer.addChild(sketch.container);
  params.debug && mainContainer.addChild(drawAxes(params));
  const children = app.stage.children ? app.stage.removeChildren() : [];
  children.forEach((obj) => obj.destroy(true));
  app.stage.addChild(mainContainer);

  const render = () => app.renderer.render(app.stage);
  const loop = renderLoop(sketch, () => ticker.deltaMS / 1000, render, stats);
  loop.loop();
  return loop.cancel;
}

function initThreeSketch(params: SketchParams): [WebGLRenderer, HTMLCanvasElement] {
  const renderer = new WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(params.width, params.height);
  return [renderer, renderer.domElement];
}

function runThreeSketch(sketch: ThreeSketch, params: SketchParams, renderer: WebGLRenderer, stats: Stats) {
  const clock = new Clock();
  const drawCallsPanel = new Panel("DrawCalls", "lightgreen", "darkgreen");
  let maxDrawCalls = 0;
  stats?.addPanel(drawCallsPanel);

  const [scene, camera] = [sketch.scene, sketch.camera];
  params.debug && scene.add(new AxesHelper(), new GridHelper());

  const render = () => {
    renderer.render(scene, camera);

    const frameDrawCalls = renderer.info.render.calls;
    maxDrawCalls = max(frameDrawCalls, maxDrawCalls);
    drawCallsPanel.update(frameDrawCalls, maxDrawCalls);
  };
  const loop = renderLoop(sketch, () => clock.getDelta(), render, stats);
  isWebGL2Available() ? loop.loop() : document.body.appendChild(getWebGL2ErrorMessage(params.width));
  return loop.cancel;
}

function renderLoop(sketch: Sketch, deltaSeconds: () => number, render: () => void, stats: Stats) {
  let totalElapsed = 0;
  let frameRecordCounter = 0;
  let needsUpdate = true;
  let requestId: number;

  const loop = () => {
    stats.begin();
    needsUpdate && render();
    needsUpdate = false;

    CanvasCapture.checkHotkeys();
    if (CanvasCapture.isRecording()) {
      CanvasCapture.recordFrame();
      frameRecordCounter++;
      if (frameRecordCounter % FPS == 0) console.log(`Recorded ${frameRecordCounter / FPS} seconds`);
    }
    if (sketch.update) {
      const deltaTime = deltaSeconds();
      totalElapsed += deltaTime;
      sketch.update(deltaTime, totalElapsed);
      needsUpdate = true;
    }

    stats.end();
    requestId = requestAnimationFrame(loop);
  };

  const cancel = () => cancelAnimationFrame(requestId);
  return { loop, cancel };
}

function isPixiSketch(sketch: Sketch): sketch is PixiSketch {
  return (<PixiSketch>sketch).container !== undefined;
}
