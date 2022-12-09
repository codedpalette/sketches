import { Container, DisplayObject, Graphics } from "pixi.js";
import { Sketch2D } from "../library/sketch";

class WhoAmI extends Sketch2D {
  setup(): Container<DisplayObject> {
    const graphics = new Graphics();
    graphics.beginFill(0xff0000);
    graphics.drawCircle(0, 0, 50);
    return graphics;
  }
}

new WhoAmI();
