import { Container, DisplayObject, Graphics, Rectangle, Assets, Texture, Sprite } from "pixi.js";
import { Sketch2D } from "../library/sketch";
import { textToPath, Font, loadFont } from "../library/text";
import { pathToPoints, generateTiling } from "../library/geometry";
import { drawPath, drawLines, LineLike } from "../library/drawing";
import "../library/util";
import paper from "paper";
import { concaveHull } from "../library/geometry";

type FontFamily = {
  regular: Font;
  bold: Font;
  italic: Font;
  boldItalic: Font;
};

type SketchParams = {
  mainFont: Font;
  secondaryFonts: FontFamily[];
  fallbackUnicodeFonts: Font[];
  lineHeight: number;
  lineMargin: number;
  margin: number;
  translations: string[];
};

class WhoAmI extends Sketch2D {
  private sketchParams: SketchParams;
  private mainPaths: paper.CompoundPath[];
  private translations: Set<string>;

  constructor(sketchParams: SketchParams, debug = false) {
    super(debug);
    this.sketchParams = sketchParams;
    this.mainPaths = [];
    this.translations = new Set([...sketchParams.translations]);
    paper.setup([this.width, this.height]);
  }

  private calculateGlyphBoundingBox(path: paper.CompoundPath) {
    const data = path.data as { yFactor?: number; hFactor?: number };
    const yFactor = data.yFactor !== undefined ? data.yFactor : (data.yFactor = path.bounds.y / path.bounds.height);
    const heightFactor = data.hFactor || (data.hFactor = (path.bounds.height + path.bounds.y) / path.bounds.height);
    path.data = data;
    const boundingBox = new Rectangle(
      path.bounds.x,
      path.bounds.y - path.bounds.height * yFactor,
      path.bounds.width,
      path.bounds.height * heightFactor
    );
    return boundingBox;
  }

  private drawBaselines(): Graphics {
    const [lineHeight, lineMargin, margin] = [
      this.sketchParams.lineHeight,
      this.sketchParams.lineMargin,
      this.sketchParams.margin,
    ];
    const graphics = new Graphics();
    graphics.lineStyle(1, 0xff0000);
    const lines: LineLike[] = [
      [-this.width / 2, lineMargin, this.width / 2, lineMargin],
      [-this.width / 2, lineMargin + lineHeight, this.width / 2, lineMargin + lineHeight],
      [-this.width / 2, -lineMargin, this.width / 2, -lineMargin],
      [-this.width / 2, -lineMargin - lineHeight, this.width / 2, -lineMargin - lineHeight],
      [-this.width / 2 + margin, this.height / 2, -this.width / 2 + margin, -this.height / 2],
      [this.width / 2 - margin, this.height / 2, this.width / 2 - margin, -this.height / 2],
    ];
    drawLines(lines, graphics);
    return graphics;
  }

  private generateMainGlyph(x: number, y: number, char: string): void {
    const path = textToPath(char, this.sketchParams.mainFont) as paper.CompoundPath;
    const boundingBox = this.calculateGlyphBoundingBox(path);
    const scaleX = this.sketchParams.lineHeight / boundingBox.width; //TODO: Maybe fix for very wide letters
    const scaleY = this.sketchParams.lineHeight / boundingBox.height;
    path.translate([-boundingBox.width / 2, -boundingBox.height / 2]);
    path.scale(scaleX, scaleY, [0, 0]);
    path.translate([x, y]);
    this.mainPaths.push(path);
  }

  private generateMainText(firstLine: string, secondLine: string): void {
    const [lineHeight, lineMargin, margin] = [
      this.sketchParams.lineHeight,
      this.sketchParams.lineMargin,
      this.sketchParams.margin,
    ];
    const xStart = -this.width / 2 + margin;
    [firstLine, secondLine].forEach((line, lineIdx) => {
      const y = lineIdx == 0 ? lineMargin + lineHeight / 2 : -lineMargin - lineHeight / 2;
      const lineWidth = this.width - 2 * margin;
      const xStep = lineWidth / line.length;
      [...line].forEach((char, charIdx) => {
        const x = xStart + xStep * (charIdx + 0.5);
        this.generateMainGlyph(x, y, char);
      });
    });
  }

  private drawMainText(): Container {
    const container = new Container();
    this.debug && container.addChild(this.drawBaselines());
    for (const path of this.mainPaths) {
      const graphics = new Graphics();
      if (this.debug) {
        graphics.lineStyle(1, 0x00ff00);
        graphics.drawShape(this.calculateGlyphBoundingBox(path));
      }
      path.strokeColor = new paper.Color("blue");
      graphics.addChild(drawPath(path));
      container.addChild(graphics);
    }
    return container;
  }

  private generateSecondaryText(): Container {
    const blacklistPath = new paper.CompoundPath(this.mainPaths);
    const paths = generateTiling(
      new Rectangle(-this.width / 2, this.height / 2, this.width, -this.height),
      () => {
        let textPath;
        do {
          const text = Array.from(this.translations.values()).random();
          textPath =
            textToPath(text, this.sketchParams.secondaryFonts.random().regular) ||
            textToPath(text, this.sketchParams.fallbackUnicodeFonts.random()) || //TODO: try more fallback fonts
            void this.translations.delete(text);
        } while (!textPath);
        return textPath;
      },
      blacklistPath
    );

    const graphics = new Graphics();
    for (const path of paths) {
      path.strokeColor = new paper.Color("black");
      path.fillColor = new paper.Color("black");
      graphics.addChild(drawPath(path));
      if (this.debug) {
        const points = pathToPoints(path);
        const polygonHull = concaveHull(points);
        polygonHull.strokeColor = new paper.Color("green");
        graphics.addChild(drawPath(polygonHull));
      }
    }
    return graphics;
  }

  private drawBackground(): DisplayObject {
    const canvas = new OffscreenCanvas(this.width, this.height);
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
    const gradient = ctx.createLinearGradient(this.width / 2, 0, this.width / 2, this.height);
    gradient.addColorStop(1, "#0057b7");
    gradient.addColorStop(0.5, "white");
    gradient.addColorStop(0, "#ffd700");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    const texture = Texture.from(canvas);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
  }

  setup(): Container<DisplayObject> {
    this.generateMainText("ХТО", "Я?");
    const container = new Container();
    container.addChild(this.drawBackground());
    //container.addChild(this.drawMainText());
    container.addChild(this.generateSecondaryText());
    //const graphics = new Graphics();
    //const path = textToPath("Who am i", this.sketchParams.fallbackUnicodeFonts[0])!;
    //path.strokeColor = new paper.Color("blue");
    //path.scale(0.1, [0, 0]);
    //const graphics = drawPath(path);
    //graphics.lineStyle(1, 0x0000ff);
    //graphics.beginFill(0x0000ff);
    //container.addChild(graphics);
    return container;
  }
}

async function start() {
  const mainFont = await loadFont("whoami/StalinistOne-Regular.ttf");
  const secondaryFonts = await Promise.all(
    ["Verdana", "Courier New", "Georgia"].map(async (fontName) => {
      const regular = await loadFont(`whoami/${fontName}/${fontName}.ttf`);
      const bold = await loadFont(`whoami/${fontName}/${fontName} Bold.ttf`);
      const italic = await loadFont(`whoami/${fontName}/${fontName} Italic.ttf`);
      const boldItalic = await loadFont(`whoami/${fontName}/${fontName} Bold Italic.ttf`);
      return {
        regular,
        bold,
        italic,
        boldItalic,
      };
    })
  );
  const fallbackUnicodeFont = await loadFont("whoami/GoNotoCurrent.ttf");
  const fallbackUnicodeFontSerif = await loadFont("whoami/GoNotoCurrentSerif.ttf");
  const fallbackUnicodeFonts = [fallbackUnicodeFont, fallbackUnicodeFontSerif];
  const lineHeight = 300;
  const lineMargin = 50;
  const margin = 10;
  const translations = (await Assets.load<string>("whoami/translated.txt")) as string;
  const sketchParams = {
    mainFont,
    secondaryFonts,
    fallbackUnicodeFonts,
    lineHeight,
    lineMargin,
    margin,
    translations: translations.split("\n"),
  };
  new WhoAmI(sketchParams).draw();
}
void start();
