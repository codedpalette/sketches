import { Application, Container } from "pixi.js";
import { AxesHelper, Camera, Clock, GridHelper, Scene, WebGLRenderer } from "three";
import { drawAxes } from "./pixi";
import { getWebGL2ErrorMessage, isWebGL2Available } from "./webgl";
import Stats, { Panel } from "stats.js";
import { max } from "mathjs";

export interface SketchParams {
  debug: boolean;
  width: number;
  height: number;
  bgColor: string | number;
}

export function init(params?: Partial<SketchParams>): SketchParams {
  const defaultParams: SketchParams = {
    debug: false,
    width: 1080,
    height: 1080,
    bgColor: "white",
  };
  return { ...defaultParams, ...params };
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

function isPixiSketch(sketch: Sketch): sketch is PixiSketch {
  return (<PixiSketch>sketch).container !== undefined;
}

export function run(sketch: PixiSketch | ThreeSketch, params: SketchParams) {
  const stats = params.debug ? new Stats() : undefined;
  stats?.showPanel(0);
  stats && document.body.appendChild(stats.dom);

  if (isPixiSketch(sketch)) runPixi(sketch, params, stats);
  else runThree(sketch, params, stats);
}

function runPixi(sketch: PixiSketch, params: SketchParams, stats?: Stats) {
  const app = new Application({
    width: params.width,
    height: params.height,
    backgroundColor: params.bgColor,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  document.body.appendChild(app.view as unknown as Node);

  const mainContainer = new Container();
  mainContainer.position = { x: params.width / 2, y: params.height / 2 };
  mainContainer.scale.set(1, -1);
  params.debug && mainContainer.addChild(drawAxes(params));
  mainContainer.addChild(sketch.container);

  app.stage.addChild(mainContainer);
  if (sketch.update) {
    let totalElapsed = 0;
    const update = sketch.update;
    app.ticker.add(() => {
      stats?.begin();
      const deltaSeconds = app.ticker.deltaMS / 1000;
      totalElapsed += deltaSeconds;
      update(deltaSeconds, totalElapsed);
      stats?.end();
    });
  }
}

function runThree(sketch: ThreeSketch, params: SketchParams, stats?: Stats) {
  if (params.debug) {
    sketch.scene.add(new AxesHelper(), new GridHelper());
  }

  const drawCallsPanel = new Panel("DrawCalls", "lightgreen", "darkgreen");
  stats?.addPanel(drawCallsPanel);

  const renderer = new WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    stencil: false,
    depth: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setSize(params.width, params.height);
  document.body.appendChild(renderer.domElement);

  const clock = new Clock(true);
  let maxDrawCalls = 0;
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

  if (isWebGL2Available()) render();
  else document.body.appendChild(getWebGL2ErrorMessage(params.width));
}
