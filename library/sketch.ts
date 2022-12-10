import { Application, Container } from "pixi.js";

export abstract class Sketch2D {
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

  abstract setup(): Container;
  update(delta: number, container: Container): void {}

  draw(): void {
    const container = this.setup();
    container.position = { x: this.width / 2, y: this.height / 2 };
    container.scale.set(1, -1);
    this.app.stage.addChild(container);

    this.app.ticker.add((delta) => {
      this._elapsed += delta;
      this.update(delta, container);
    });
  }

  constructor(width = 1080, height = 1080, bgColor: string | number = "white") {
    this.app = new Application({
      width,
      height,
      antialias: true,
      backgroundColor: bgColor,
    });
    document.body.appendChild(this.app.view as any as Node);
  }
}
