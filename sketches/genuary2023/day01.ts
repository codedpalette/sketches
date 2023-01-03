import { Sketch2D } from "drawing/sketch";
import { Container, DisplayObject } from "pixi.js";

class Day01 extends Sketch2D {
  constructor(debug = false) {
    super(debug);
  }

  protected setup(): Container<DisplayObject> {
    return new Container();
  }
}

new Day01(true).draw();
