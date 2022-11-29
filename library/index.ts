import { Application, Sprite } from "pixi.js";

const app = new Application({ width: 1080, height: 1080 });
//eslint-disable-next-line
//@ts-ignore
document.body.appendChild(app.view);

const sprite = Sprite.from("bunny.png");
app.stage.addChild(sprite);

let elapsed = 0.0;
app.ticker.add((delta) => {
  elapsed += delta;
  sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0;
});
