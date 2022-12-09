import { Application, Container } from "pixi.js";

export abstract class Sketch2D {
  private container: Container;
  private _elapsed = 0.0;

  protected get elapsed() {
    return this._elapsed;
  }

  abstract setup(): Container;

  update(delta: number, container: Container): void {}

  constructor(width = 1080, height = 1080, bgColor: string | number = "white") {
    const app = new Application({
      width,
      height,
      antialias: true,
      backgroundColor: bgColor,
    });
    document.body.appendChild(app.view as any as Node);

    this.container = this.setup();
    this.container.position = { x: width / 2, y: height / 2 };
    this.container.scale = { x: 1, y: -1 };
    app.stage.addChild(this.container);

    app.ticker.add((delta) => {
      this._elapsed += delta;
      this.update(delta, this.container);
    });
  }
}
