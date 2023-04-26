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

  const stats = params.debug && sketch.update ? new Stats() : undefined;
  stats?.showPanel(0);
  stats && document.body.appendChild(stats.dom);

  //TODO: Add redrawing on click
  const canvas = isPixiSketch(sketch) ? runPixiSketch(sketch, params, stats) : runThreeSketch(sketch, params, stats);
  canvas.id = "canvas";
  document.body.appendChild(canvas);
  //TODO: Add storing png with canvas-capture
  CanvasCapture.init(canvas, { showRecDot: true });
}

function setDefaultParams(params?: Partial<SketchParams>): SketchParams {
  const defaultParams: SketchParams = {
    debug: false,
    width: 1080,
    height: 1080,
  };
  return { ...defaultParams, ...params };
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

function runPixiSketch(sketch: PixiSketch, params: SketchParams, stats?: Stats): HTMLCanvasElement {
  const app = new Application({
    width: params.width,
    height: params.height,
    backgroundAlpha: 0,
    antialias: true,
    preserveDrawingBuffer: true,
  });

  const ticker = new Ticker();
  const mainContainer = new Container();
  mainContainer.position = { x: params.width / 2, y: params.height / 2 };
  mainContainer.scale.set(1, -1);
  mainContainer.addChild(sketch.container);
  params.debug && mainContainer.addChild(drawAxes(params));
  app.stage.addChild(mainContainer);

  const render = () => app.renderer.render(app.stage);
  const loop = renderLoop(sketch, () => ticker.deltaMS / 1000, render, stats);
  loop();
  return app.view as HTMLCanvasElement;
}

function runThreeSketch(sketch: ThreeSketch, params: SketchParams, stats?: Stats): HTMLCanvasElement {
  const renderer = new WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(params.width, params.height);

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
  return renderer.domElement;
}

function renderLoop(sketch: Sketch, deltaSeconds: () => number, render: () => void, stats?: Stats) {
  let totalElapsed = 0;

  const loop = () => {
    stats?.begin();
    render();

    CanvasCapture.checkHotkeys();
    if (sketch.update) {
      const deltaTime = deltaSeconds();
      totalElapsed += deltaTime;
      sketch.update(deltaTime, totalElapsed);
    }

    requestAnimationFrame(loop);
    stats?.end();
  };
  return loop;
}

function isPixiSketch(sketch: Sketch): sketch is PixiSketch {
  return (<PixiSketch>sketch).container !== undefined;
}
