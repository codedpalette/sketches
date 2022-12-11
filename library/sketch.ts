import { Application, Container, Graphics } from "pixi.js";
import { drawLines, LineLike } from "./drawing";

export abstract class Sketch2D {
  protected debug: boolean;
  private app: Application;
  private _elapsed = 0.0;

  protected get elapsed() {
    return this._elapsed;
  }

  protected get width() {
    return this.app.renderer.width;
  }

  protected get height() {
    return this.app.renderer.height;
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

  abstract setup(): Container;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  update(_delta: number, _container: Container): void {}

  draw(): void {
    const container = this.setup();
    container.position = { x: this.width / 2, y: this.height / 2 };
    container.scale.set(1, -1);
    this.debug && container.addChildAt(this.drawAxes(), 0);
    this.app.stage.addChild(container);

    this.app.ticker.add((delta) => {
      this._elapsed += delta;
      this.update(delta, container);
    });
  }

  constructor(debug: boolean, width = 1080, height = 1080, bgColor: string | number = "white") {
    this.debug = debug;
    this.app = new Application({
      width,
      height,
      antialias: true,
      backgroundColor: bgColor,
    });
    document.body.appendChild(this.app.view as unknown as Node);
  }
}
