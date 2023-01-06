import { setup } from "geometry";
import { Application, Container, Graphics, Text } from "pixi.js";
import { drawLines, LineLike } from "./helpers";

//TODO: Refactor to functional interface
export abstract class Sketch2D {
  private app: Application;

  constructor(
    protected readonly debug: boolean,
    protected readonly width = 1080,
    protected readonly height = 1080,
    bgColor: string | number = "white"
  ) {
    this.app = new Application({
      width,
      height,
      antialias: true,
      backgroundColor: bgColor,
      preserveDrawingBuffer: true,
    });
    document.body.appendChild(this.app.view as unknown as Node);
    setup([this.width, this.height]);
  }

  protected get renderer() {
    return this.app.renderer;
  }

  draw(): void {
    const mainContainer = new Container();
    mainContainer.position = { x: this.width / 2, y: this.height / 2 };
    mainContainer.scale.set(1, -1);
    const container = this.setup();
    this.debug && this.drawDebug(mainContainer);
    mainContainer.addChild(container);

    this.app.stage.addChild(mainContainer);
    this.app.ticker.add(() => {
      const delta = this.app.ticker.deltaMS / 1000;
      this.update(delta);
    });
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  protected update(deltaTime: number): void {
    //by default do nothing
  }

  private drawDebug(mainContainer: Container) {
    mainContainer.addChild(this.drawAxes());
    mainContainer.addChild(this.drawFPS());
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

    this.app.ticker.add(() => this.updateFPS(fpsContainer));
    return fpsContainer;
  }

  private updateFPS(fpsContainer: Container) {
    const fpsText = fpsContainer.getChildAt(1) as Text;
    fpsText.text = this.app.ticker.FPS.toFixed(1);
  }

  private drawAxes(): Graphics {
    const graphics = new Graphics();
    graphics.lineStyle(1, 0xff0000);
    const lines: LineLike[] = [
      [-this.width / 2, 0, this.width / 2, 0],
      [0, this.height / 2, 0, -this.height / 2],
    ];
    drawLines(lines, graphics);
    return graphics;
  }

  protected abstract setup(): Container;
}
