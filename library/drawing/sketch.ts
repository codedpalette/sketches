import { Application, Container, Ticker } from "pixi.js";
import { AxesHelper, Camera, Clock, GridHelper, Scene, WebGLRenderer } from "three";
import { drawAxes } from "./pixi";
import { getWebGL2ErrorMessage, isWebGL2Available } from "./webgl";
import Stats, { Panel } from "stats.js";
import { max } from "mathjs";
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
//const FPS = 60;

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

  const redraw = () => {
    const sketch = sketchFactory(params);
    runSketch(sketch, params, ctx, stats);
  };
  canvas.onclick = redraw;
  document.body.appendChild(canvas);

  //TODO: Add storing png with canvas-capture
  CanvasCapture.init(canvas, { showRecDot: true });
  runSketch(sketch, params, ctx, stats);
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
  if (isPixiSketch(sketch)) runPixiSketch(sketch, params, ctx as Application, stats);
  else runThreeSketch(sketch, params, ctx as WebGLRenderer, stats);
}

//TODO: Add capture mode
// export function capture(seconds: number, sketch: Required<Sketch>, params: SketchParams) {
//   const [canvas, ctx] = getCanvasAndContext(sketch, params);
//   document.body.appendChild(canvas);
//   CanvasCapture.init(canvas, { showRecDot: true });

//   const maxFrames = seconds * FPS;
//   let frameCounter = 0;
//   const update = sketch.update;
//   sketch.update = (deltaTime: number, elapsedTotal: number) => {
//     update(deltaTime, elapsedTotal);
//     if (CanvasCapture.isRecording()) {
//       CanvasCapture.recordFrame();
//       frameCounter++;
//       if (frameCounter % FPS == 0) console.log(`Recorded ${frameCounter / FPS}/${seconds} seconds`);
//       if (frameCounter == maxFrames) void CanvasCapture.stopRecord();
//     }
//   };

//   runSketch(sketch, { ...params, debug: false }, ctx);
//   CanvasCapture.beginVideoRecord({
//     onExportProgress: (progress) => console.log(`Processing recording, ${round(progress * 100)}%...`),
//   });
// }

function initPixiSketch(params: SketchParams): [Application, HTMLCanvasElement] {
  const app = new Application({
    width: params.width,
    height: params.height,
    backgroundAlpha: 0,
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
  if (app.stage.children) {
    const children = app.stage.removeChildren();
    children.forEach((obj) => obj.destroy(true));
  }
  app.stage.addChild(mainContainer);

  const render = () => app.renderer.render(app.stage);
  const loop = renderLoop(sketch, () => ticker.deltaMS / 1000, render, stats);
  loop();
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
  isWebGL2Available() ? loop() : document.body.appendChild(getWebGL2ErrorMessage(params.width));
}

function renderLoop(sketch: Sketch, deltaSeconds: () => number, render: () => void, stats: Stats) {
  let totalElapsed = 0;
  let needsUpdate = true;

  const loop = () => {
    stats.begin();
    needsUpdate && render();
    needsUpdate = false;

    CanvasCapture.checkHotkeys();
    if (sketch.update) {
      const deltaTime = deltaSeconds();
      totalElapsed += deltaTime;
      sketch.update(deltaTime, totalElapsed);
      needsUpdate = true;
    }

    stats.end();
    requestAnimationFrame(loop);
  };
  return loop;
}

function isPixiSketch(sketch: Sketch): sketch is PixiSketch {
  return (<PixiSketch>sketch).container !== undefined;
}
