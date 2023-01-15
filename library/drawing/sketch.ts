import { Application, Container } from "pixi.js";
import { AxesHelper, Camera, Clock, GridHelper, Scene, WebGLRenderer } from "three";
import { drawAxes } from "./pixi";
import { getWebGL2ErrorMessage, isWebGL2Available } from "./webgl";

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
  if (isPixiSketch(sketch)) runPixi(sketch, params);
  else runThree(sketch, params);
}

function runPixi(sketch: PixiSketch, params: SketchParams) {
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
      const deltaSeconds = app.ticker.deltaMS / 1000;
      totalElapsed += deltaSeconds;
      update(deltaSeconds, totalElapsed);
    });
  }
}

function runThree(sketch: ThreeSketch, params: SketchParams) {
  if (params.debug) {
    sketch.scene.add(new AxesHelper(), new GridHelper());
  }

  const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
  renderer.setSize(params.width, params.height);
  document.body.appendChild(renderer.domElement);

  const clock = new Clock(true);
  const render = () => {
    if (sketch.update) {
      requestAnimationFrame(render);
      sketch.update(clock.getDelta(), clock.elapsedTime);
    }
    renderer.render(sketch.scene, sketch.camera);
  };

  if (isWebGL2Available()) render();
  else document.body.appendChild(getWebGL2ErrorMessage(params.width));
}
