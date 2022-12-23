import paper from "paper";
import { Application, Container, Graphics } from "pixi.js";
import { drawLines, LineLike } from "./drawing/helpers";

export abstract class Sketch2D {
  protected debug: boolean;
  private app: Application;
  private _elapsed = 0.0;

  constructor(debug: boolean, width = 1080, height = 1080, bgColor: string | number = "white") {
    this.debug = debug;
    this.app = new Application({
      width,
      height,
      antialias: true,
      backgroundColor: bgColor,
      preserveDrawingBuffer: true,
    });
    document.body.appendChild(this.app.view as unknown as Node);
    paper.setup([this.width, this.height]);
  }

  protected get elapsed() {
    return this._elapsed;
  }

  protected get width() {
    return this.app.renderer.width;
  }

  protected get height() {
    return this.app.renderer.height;
  }

  draw(): void {
    const container = this.setup();
    container.position = { x: this.width / 2, y: this.height / 2 };
    container.scale.set(1, -1);
    this.app.stage.addChild(container);
    this.debug && container.addChild(this.drawAxes());

    this.app.ticker.add((delta) => {
      this._elapsed += delta;
      this.update(delta, container);
    });
  }

  protected update(_delta: number, _container: Container): void {
    //by default do nothing
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

  protected abstract setup(): Container; //TODO: Encapsulate concrete `Container` type
}
