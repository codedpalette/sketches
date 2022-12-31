import { drawPath } from "drawing/helpers";
import { Sketch2D } from "drawing/sketch";
import { Color, Rectangle } from "geometry/paper";
import { Container, DisplayObject } from "pixi.js";

class Stripes extends Sketch2D {
  constructor(debug: boolean) {
    super(debug);
  }

  protected setup(): Container<DisplayObject> {
    const rect = new Rectangle(-300, 300, 600, -600).toPath();
    rect.fillColor = new Color("black");
    const graphics = drawPath(rect);
    return graphics;
  }
}

new Stripes(true).draw();
