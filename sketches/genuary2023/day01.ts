import { Sketch2D } from "drawing/sketch";
import { multiply, round } from "mathjs";
import { rectanglePacking } from "packing/rectangle";
import { Rectangle } from "paper";
import { Container, DisplayObject, Graphics, SimplePlane } from "pixi.js";

//TODO: Try three.js
class Day01 extends Sketch2D {
  private renderTexture = this.app.renderer.generateTexture(this.generateInfinitePacking());
  private loopDurationSeconds = 10;

  protected setup(): Container<DisplayObject> {
    const container = new Container();
    const plane = new SimplePlane(this.renderTexture, 100, 100);
    plane.position = { x: -this.width / 2, y: -this.height / 2 };

    const vertexBuffer = plane.geometry.getBuffer("aVertexPosition");
    const matrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const [xFactor, yFactor] = [plane.width, plane.height];
    for (let i = 0; i < vertexBuffer.data.length; i += 2) {
      const coords = [vertexBuffer.data[i] / xFactor, vertexBuffer.data[i + 1] / yFactor];
      const vec3 = [...coords, 1];
      const transformed = multiply(matrix, vec3);
      vertexBuffer.data[i] = (transformed[0] * xFactor) / transformed[2];
      vertexBuffer.data[i + 1] = (transformed[1] * yFactor) / transformed[2];
    }
    vertexBuffer.update();

    container.addChild(plane);
    return container;
  }

  protected update(deltaTime: number): void {
    const offSetPixels = round((deltaTime * this.height) / this.loopDurationSeconds); //TODO: Google how to do offsets
    this.renderTexture.frame.y += offSetPixels;
    if (this.renderTexture.frame.y >= this.height) {
      this.renderTexture.frame.y -= this.height;
    }
    this.renderTexture.updateUvs();
  }

  private generateInfinitePacking(): Container<Graphics> {
    const graphics = new Graphics();
    graphics.lineStyle(1, 0x000000);
    const rects = rectanglePacking(new Rectangle(0, 0, this.width, this.height), 20);
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

new Day01({ debug: true }).run();
