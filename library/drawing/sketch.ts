import { Application, Container } from "pixi.js";
import { drawAxes } from "./pixi";

export interface SketchParams {
  debug: boolean;
  width: number;
  height: number;
  bgColor: string | number; //TODO: Color library
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

export function run(sketch: PixiSketch, params: SketchParams) {
  runPixi(sketch, params);
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
