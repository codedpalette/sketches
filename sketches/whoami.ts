import { Container, DisplayObject, Graphics, TextStyle, Text } from "pixi.js";
import { Sketch2D } from "../library/sketch";
import * as opentype from "opentype.js";

class WhoAmI extends Sketch2D {
  font: opentype.Font;

  constructor(font: opentype.Font) {
    super();
    this.font = font;
  }

  private parseCommand(command: opentype.PathCommand, graphics: Graphics) {
    switch (command.type) {
      case "M":
        graphics.moveTo(command.x, command.y);
        break;
      case "L":
        graphics.lineTo(command.x, command.y);
        break;
      case "C":
        graphics.bezierCurveTo(
          command.x1,
          command.y1,
          command.x2,
          command.y2,
          command.x,
          command.y
        );
        break;
      case "Q":
        graphics.quadraticCurveTo(command.x1, command.y1, command.x, command.y);
        break;
      case "Z":
        graphics.closePath();
        break;
    }
  }

  private generateMainText(): Graphics {
    const glyph = this.font.charToGlyph("Х");
    const path = glyph.getPath();
    const graphics = new Graphics();
    graphics.lineStyle(1, 0x0000ff);
    path.commands.forEach((command) => this.parseCommand(command, graphics));
    const bounds = graphics.getBounds();
    graphics.lineStyle(1, 0xff0000);
    graphics.drawShape(bounds);
    return graphics;
  }

  setup(): Container<DisplayObject> {
    return this.generateMainText();
  }
}

opentype.load("whoami/StalinistOne-Regular.ttf", (err, font) => {
  font ? new WhoAmI(font).draw() : console.error(err);
});
