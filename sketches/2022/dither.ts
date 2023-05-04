import { run, Params } from "drawing/sketch";
import getPixels from "get-pixels";
import { NdArray } from "ndarray";
import { Color, Container, Sprite, Texture } from "pixi.js";
import { hex } from "color-convert";
import { random } from "util/random";

getPixels("dither/pic.jpg", (err, pixels) => {
  if (err) {
    console.log("Bad image path");
    return;
  }

  run((params) => {
    const brightThresh = random.integer(30, 50);

    for (let row = 0; row < params.height; row++) {
      console.log(`Processing row ${row}`);
      const rowPixels = pixels.pick(null, row, null);
      sortRow(rowPixels, row);
    }

    const texture = Texture.fromBuffer(pixels.data, params.width, params.height);
    const sprite = new Sprite(texture);
    sprite.scale = { x: 1, y: -1 };
    sprite.position = { x: -params.width / 2, y: params.height / 2 };

    const container = new Container();
    container.addChild(sprite);
    return { container };

    function sortRow(rowPixels: NdArray<Uint8Array>, y: number) {
      const bri = (color: Color) => hex.hsv(color.toHex())[2];
      const pixelColors = [];
      for (let i = 0; i < rowPixels.shape[0]; i++) {
        pixelColors.push(new Color({ r: rowPixels.get(i, 0), g: rowPixels.get(i, 1), b: rowPixels.get(i, 2) }));
      }
      const pixelValues = pixelColors.map((color) => bri(color));
      let xStart = 0,
        xEnd = 0;
      while (xEnd < params.width - 1) {
        xStart = pixelValues.findIndex((e, i) => i > xStart && e > brightThresh);
        xEnd = pixelValues.findIndex((e, i) => i > xStart && e < brightThresh);
        if (xStart < 0 || xEnd < 0) break;

        const sorted = pixelColors.slice(xStart, xEnd).sort((a, b) => bri(a) - bri(b));
        sorted.forEach((color, i) => {
          pixels.set(xStart + i, y, 0, color.red * 255);
          pixels.set(xStart + i, y, 1, color.green * 255);
          pixels.set(xStart + i, y, 2, color.blue * 255);
        });

        xStart = xEnd + 1;
      }
    }
  }, Params.DEBUG);
});
