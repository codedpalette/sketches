import { Sketch2D } from "drawing/sketch";
import { round } from "mathjs";
import { rectanglePacking } from "packing/rectangle";
import { Rectangle } from "paper";
import { Container, DisplayObject, Graphics } from "pixi.js";

class Day01 extends Sketch2D {
  private sideContainer: Container<Graphics>;
  private loopDurationSeconds = 15;

  constructor(debug = false) {
    super(debug);
    this.sideContainer = this.generateInfinitePacking();
    this.sideContainer.position = { x: -this.width / 2, y: -this.height / 2 };
  }

  protected setup(): Container<DisplayObject> {
    const container = new Container();
    container.addChild(this.sideContainer);
    return container;
  }

  protected update(deltaTime: number): void {
    const offSetPixels = round((deltaTime * this.height) / this.loopDurationSeconds);
    for (const childGraphic of this.sideContainer.children) {
      childGraphic.position.y -= offSetPixels;
      if (childGraphic.position.y <= -this.height) {
        childGraphic.position.y = this.height;
      }
    }
  }

  private generateInfinitePacking(): Container<Graphics> {
    const graphics = new Graphics();
    graphics.lineStyle(1, 0x000000);
    const rects = rectanglePacking(new Rectangle(0, 0, this.width, this.height), 20, this.random);
    for (const rect of rects) {
      graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
    }

    const backupGraphics = graphics.clone();
    backupGraphics.position = { x: 0, y: this.height };
    const container = new Container<Graphics>();
    container.addChild(backupGraphics);
    container.addChild(graphics);
    return container;
  }
}

new Day01(true).draw();
