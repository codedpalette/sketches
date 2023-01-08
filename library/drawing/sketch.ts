import { setup as setupPaper } from "geometry";
import { Application, Container, Graphics, Text } from "pixi.js";
import { drawLines, LineLike } from "./helpers";

export interface SketchParams {
  debug: boolean;
  width: number;
  height: number;
  bgColor: string | number;
}
export type SketchParamsPartial = Partial<SketchParams>;

export abstract class Sketch2D {
  protected readonly debug: boolean;
  protected readonly width: number;
  protected readonly height: number;
  protected readonly bgColor: string | number;
  protected readonly app: Application;

  constructor(paramsPartial?: SketchParamsPartial) {
    ({
      debug: this.debug = false,
      width: this.width = 1080,
      height: this.height = 1080,
      bgColor: this.bgColor = "white",
    } = paramsPartial ?? {});
    this.app = new Application({
      width: this.width,
      height: this.height,
      antialias: true,
      backgroundColor: this.bgColor,
      preserveDrawingBuffer: true,
    });
    document.body.appendChild(this.app.view as unknown as Node);
    setupPaper([this.width, this.height]);
  }

  run(): void {
    const mainContainer = new Container();
    mainContainer.position = { x: this.width / 2, y: this.height / 2 };
    mainContainer.scale.set(1, -1);

    this.debug && mainContainer.addChild(this.drawAxes(), this.drawFPS());
    mainContainer.addChild(this.setup());

    this.app.stage.addChild(mainContainer);
    this.app.ticker.add(() => this.update(this.app.ticker.deltaMS / 1000));
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  protected update(deltaTime: number): void {
    //by default do nothing
  }

  private drawFPS(): Container {
    const margin = 10;
    const fpsText = new Text(this.app.ticker.FPS.toFixed(1));
    
    const fpsContainer = new Container();
    fpsContainer.position = { x: this.width / 2 - fpsText.width - margin, y: this.height / 2 - margin };
    fpsContainer.scale.set(1, -1);

    const fpsBackground = new Graphics()
      .beginFill(0x777777, 0.5)
      .drawRect(-margin / 2, -margin / 2, fpsText.width + margin, fpsText.height + margin);
    fpsContainer.addChild(fpsBackground);
    fpsContainer.addChild(fpsText);

    this.app.ticker.add(() => {
      fpsText.text = this.app.ticker.FPS.toFixed(1);
    });
    return fpsContainer;
  }

  private drawAxes(): Graphics {
    const graphics = new Graphics().lineStyle(1, 0xff0000);
    const lines: LineLike[] = [
      [-this.width / 2, 0, this.width / 2, 0],
      [0, this.height / 2, 0, -this.height / 2],
    ];
    drawLines(lines, graphics);
    return graphics;
  }

  protected abstract setup(): Container;
}
