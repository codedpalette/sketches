import { Sketch2D } from "../library/sketch";
import { textToPath, Font, loadFont } from "../library/text";
import { pathToPoints, generateTiling } from "../library/geometry";
import { drawPath, drawLines, LineLike } from "../library/drawing";
import { concaveHull } from "../library/geometry";
import "../library/util";

import { Container, DisplayObject, Graphics, Rectangle, Assets } from "pixi.js";
import paper from "paper";
import { random } from "../library/util";

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
  rotation: number;
  firstLine: string;
  secondLine: string;
  translations: string[];
};

class WhoAmI extends Sketch2D {
  private sketchParams: SketchParams;
  private mainPaths: paper.CompoundPath[];
  private translations: Set<string>;
  private background: Graphics;
  private foreground: Graphics;

  constructor(sketchParams: SketchParams, debug = false) {
    super(debug);
    this.sketchParams = sketchParams;
    this.mainPaths = [];
    this.translations = new Set([...sketchParams.translations]);

    const cpt1: [number, number] = [random(-this.width / 2, 0), random(0, this.height / 2)];
    const cpt2: [number, number] = [random(0, this.width / 2), random(-this.height / 2, 0)];
    this.background = this.createFlag(true, this.sketchParams.rotation, [cpt1, cpt2]);
    this.foreground = this.createFlag(false, this.sketchParams.rotation, [cpt1, cpt2]);
    paper.setup([this.width, this.height]);
  }

  private createFlag(isBack: boolean, rotation: number, controlPoints: [[number, number], [number, number]]): Graphics {
    const blue = 0x0057b7;
    const yellow = 0xffd700;
    const graphics = new Graphics();
    graphics.beginFill(isBack ? blue : yellow);
    graphics.drawRect(-this.width, -this.height, this.width * 2, this.height * 2);
    graphics.endFill();
    graphics.beginFill(isBack ? yellow : blue);
    graphics.moveTo(-this.width, -this.height);
    graphics.lineTo(-this.width, 0);

    const [cpt1, cpt2] = controlPoints;
    graphics.bezierCurveTo(cpt1[0], cpt1[1], cpt2[0], cpt2[1], this.width, 0);
    graphics.lineTo(this.width, -this.height);
    graphics.closePath();
    graphics.angle = rotation;
    return graphics;
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
    const path = textToPath(char, this.sketchParams.mainFont, true) as paper.CompoundPath;
    const boundingBox = this.calculateGlyphBoundingBox(path);
    const scaleX = this.sketchParams.lineHeight / boundingBox.width;
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
    const pathSteps = 10;
    const alphaStep = (1 - 0.5) / pathSteps;
    for (const path of this.mainPaths) {
      const graphics = new Graphics();
      if (this.debug) {
        graphics.lineStyle(1, 0x00ff00);
        graphics.drawShape(this.calculateGlyphBoundingBox(path));
      }
      path.strokeColor = new paper.Color("black");
      const scaleCenterX = path.bounds.x + path.bounds.width / 2;
      const scaleCenterY = path.bounds.y < 0 ? path.bounds.y : path.bounds.y + path.bounds.height;
      for (let i = 0; i < pathSteps; i++) {
        const pathCopy = path.clone();
        pathCopy.scale(1 - alphaStep * i, [scaleCenterX, scaleCenterY]);
        pathCopy.strokeWidth = 1 - alphaStep * i;
        const pathGraphics = drawPath(pathCopy);
        pathGraphics.alpha = 0.5 - alphaStep * i;
        graphics.addChild(pathGraphics);
      }
      container.addChild(graphics);
    }
    return container;
  }

  private generateSecondaryText(): Container {
    const blacklistPath = new paper.CompoundPath(this.mainPaths);
    const allFontVariants = this.sketchParams.secondaryFonts.flatMap((ff) => [
      ff.regular,
      ff.bold,
      ff.italic,
      ff.boldItalic,
    ]);
    const paths = generateTiling(
      new Rectangle(-this.width / 2, this.height / 2, this.width, -this.height),
      () => {
        let textPath;
        do {
          const text = Array.from(this.translations.values()).random(); //TODO: random rotation and skew
          textPath =
            textToPath(text, allFontVariants.random()) ||
            textToPath(text, this.sketchParams.fallbackUnicodeFonts.random()) ||
            void this.translations.delete(text);
        } while (!textPath);
        return textPath;
      },
      blacklistPath
    );

    const mask = new Graphics();
    const debugGraphics = new Graphics();
    for (const path of paths) {
      path.fillColor = new paper.Color("white");
      mask.addChild(drawPath(path));
      if (this.debug) {
        const points = pathToPoints(path);
        const polygonHull = concaveHull(points);
        polygonHull.strokeColor = new paper.Color("green");
        debugGraphics.addChild(drawPath(polygonHull));
      }
    }

    const maskContainer = new Container();
    maskContainer.mask = mask;
    maskContainer.addChild(mask);
    maskContainer.addChild(this.foreground);
    return maskContainer;
  }

  setup(): Container<DisplayObject> {
    this.generateMainText(this.sketchParams.firstLine, this.sketchParams.secondLine);
    const container = new Container();
    container.addChild(this.background);
    container.addChild(this.drawMainText());
    container.addChild(this.generateSecondaryText());
    return container;
  }
}

async function start(firstLine: string, secondLine: string, rotation: number) {
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
  const translations = (await Assets.load<string>("whoami/translated.txt")) as string; //TODO: translate other phrases
  const sketchParams = {
    mainFont,
    secondaryFonts,
    fallbackUnicodeFonts,
    lineHeight,
    lineMargin,
    margin,
    rotation,
    firstLine,
    secondLine,
    translations: translations.split("\n"),
  };
  new WhoAmI(sketchParams).draw();
}
void start("ХТО", "Я?", random(-45, 45));
//void start("ДЕ", "МИ?", 0);
//void start("ЩО", "ЦЕ?", 90);
