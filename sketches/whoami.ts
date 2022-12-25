import { Assets, Container, DisplayObject, Graphics } from "pixi.js";
import { drawLines, drawPath, LineLike } from "../library/drawing/helpers";
import { Font, loadFont, textToPath } from "../library/drawing/text";
import { generatePacking } from "../library/geometry/packing";
import { Color, CompoundPath, Rectangle } from "../library/geometry/paper";
import { Sketch2D } from "../library/sketch";
import { random } from "../library/util/random";
interface FontFamily {
  regular: Font;
  bold: Font;
  italic: Font;
  boldItalic: Font;
}

interface SketchParams {
  mainFont: Font;
  secondaryFontFamilies: FontFamily[];
  fallbackUnicodeFonts: Font[];
  flagRotation: number;
  firstLine: string;
  secondLine: string;
  translations: string[];
}

class WhoAmI extends Sketch2D {
  private readonly nTexts = 500;
  private readonly lineHeight = 300;
  private readonly lineSpacing = 50;
  private readonly margin = 10;
  private sketchParams: SketchParams;
  private mainPaths: CompoundPath[];
  private translations: Set<string>;
  private background: Graphics;
  private foreground: Graphics;

  constructor(sketchParams: SketchParams, debug = false) {
    super(debug);
    this.sketchParams = sketchParams;
    this.mainPaths = [];
    this.translations = new Set([...sketchParams.translations]);

    // Setup control points for a flag curve
    const cpt1: [number, number] = [random(-this.width / 2, 0), random(0, this.height / 2)];
    const cpt2: [number, number] = [random(0, this.width / 2), random(-this.height / 2, 0)];
    this.background = this.createFlag(true, this.sketchParams.flagRotation, [cpt1, cpt2]);
    this.foreground = this.createFlag(false, this.sketchParams.flagRotation, [cpt1, cpt2]);
    Math.random() > 0.5 && ([this.background, this.foreground] = [this.foreground, this.background]);
  }

  setup(): Container<DisplayObject> {
    const container = new Container();
    this.generateMainText();
    !this.debug && container.addChild(this.background);
    container.addChild(this.drawMainText());
    container.addChild(this.generateSecondaryTexts());
    return container;
  }

  private generateMainText(): void {
    const [firstLine, secondLine, lineHeight, lineSpacing, margin] = [
      this.sketchParams.firstLine,
      this.sketchParams.secondLine,
      this.lineHeight,
      this.lineSpacing,
      this.margin,
    ];

    const xStart = -this.width / 2 + margin;
    [firstLine, secondLine].forEach((line, lineIdx) => {
      const y = lineIdx == 0 ? lineSpacing + lineHeight / 2 : -lineSpacing - lineHeight / 2;
      const lineWidth = this.width - 2 * margin;
      const xStep = lineWidth / line.length;

      [...line].forEach((char, charIdx) => {
        const x = xStart + xStep * (charIdx + 0.5);
        this.generateMainGlyph(x, y, char);
      });
    });
  }

  private generateMainGlyph(x: number, y: number, char: string): void {
    const path = textToPath(char, this.sketchParams.mainFont, true) as CompoundPath; // Can't be undefined for mainFont
    const boundingBox = calculateGlyphBoundingBox(path);
    const scaleX = this.lineHeight / boundingBox.width;
    const scaleY = this.lineHeight / boundingBox.height;

    path.translate([-boundingBox.width / 2, -boundingBox.height / 2]);
    path.scale(scaleX, scaleY, [0, 0]);
    path.translate([x, y]);
    this.mainPaths.push(path);
  }

  private drawMainText(): Container {
    const container = new Container();
    const pathSteps = this.debug ? 1 : 10;
    const alphaStep = (1 - 0.5) / pathSteps;

    this.debug && container.addChild(this.drawBaselines());
    for (const path of this.mainPaths) {
      const graphics = new Graphics();
      if (this.debug) {
        const boundingBox = calculateGlyphBoundingBox(path).toPath();
        boundingBox.strokeColor = new Color("green");
        graphics.addChild(drawPath(boundingBox));
      }
      path.strokeColor = new Color("black");

      // Draw letters with decrementing scale and alpha value
      const scaleCenterX = path.bounds.x + path.bounds.width / 2;
      const scaleCenterY = path.bounds.y < 0 ? path.bounds.y + path.bounds.height : path.bounds.y;
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

  private drawBaselines(): Graphics {
    const [lineHeight, lineSpacing, margin] = [this.lineHeight, this.lineSpacing, this.margin];

    const graphics = new Graphics();
    const lines: LineLike[] = [
      [-this.width / 2, lineSpacing, this.width / 2, lineSpacing],
      [-this.width / 2, lineSpacing + lineHeight, this.width / 2, lineSpacing + lineHeight],
      [-this.width / 2, -lineSpacing, this.width / 2, -lineSpacing],
      [-this.width / 2, -lineSpacing - lineHeight, this.width / 2, -lineSpacing - lineHeight],
      [-this.width / 2 + margin, this.height / 2, -this.width / 2 + margin, -this.height / 2],
      [this.width / 2 - margin, this.height / 2, this.width / 2 - margin, -this.height / 2],
    ];

    graphics.lineStyle(1, 0xff0000);
    drawLines(lines, graphics);
    return graphics;
  }

  private textPathsFactory(): CompoundPath {
    const allFontVariants = this.sketchParams.secondaryFontFamilies.flatMap((ff) => [
      ff.regular,
      ff.bold,
      ff.italic,
      ff.boldItalic,
    ]);
    while (true) {
      const text = Array.from(this.translations.values()).random();
      const textPath =
        textToPath(text, allFontVariants.random()) ||
        textToPath(text, this.sketchParams.fallbackUnicodeFonts.random()) ||
        void this.translations.delete(text);
      if (textPath) return textPath;
    }
  }

  private generateSecondaryTexts(): Container {
    const textPathsObservable = generatePacking(() => this.textPathsFactory(), {
      boundingRect: new Rectangle(-this.width / 2, this.height / 2, this.width, -this.height),
      nShapes: this.nTexts,
      blacklistShape: new CompoundPath(this.mainPaths),
      randomizeParams: { rotationBounds: [-20, 20], skewBounds: { minHor: -5, minVer: -5, maxHor: 5, maxVer: 5 } },
    });

    const maskContainer = new Container();
    const mask = new Graphics();
    if (!this.debug) {
      maskContainer.mask = mask;
      maskContainer.addChild(mask);
      maskContainer.addChild(this.foreground);
    }

    textPathsObservable.subscribe((path) => {
      if (this.debug) {
        path.strokeColor = new Color("blue");
        maskContainer.addChild(drawPath(path));
      } else {
        path.fillColor = new Color("white");
        mask.addChild(drawPath(path));
      }
    });
    return maskContainer;
  }

  private createFlag(
    isBackground: boolean,
    flagRotation: number,
    controlPoints: [[number, number], [number, number]]
  ): Graphics {
    const blue = 0x0057b7;
    const yellow = 0xffd700;
    const graphics = new Graphics();
    const [cpt1, cpt2] = controlPoints;

    // Fill background
    graphics.beginFill(isBackground ? blue : yellow);
    graphics.drawRect(-this.width, -this.height, this.width * 2, this.height * 2);
    graphics.endFill();

    // Fill area under the curve
    graphics.beginFill(isBackground ? yellow : blue);
    graphics.moveTo(-this.width, -this.height);
    graphics.lineTo(-this.width, 0);
    graphics.bezierCurveTo(cpt1[0], cpt1[1], cpt2[0], cpt2[1], this.width, 0);
    graphics.lineTo(this.width, -this.height);
    graphics.closePath();

    graphics.angle = flagRotation;
    return graphics;
  }
}

function calculateGlyphBoundingBox(path: CompoundPath) {
  // We need to store it in the `data` to make it scale-insensitive
  const data = path.data as { yFactor?: number; hFactor?: number };
  const yFactor = data.yFactor !== undefined ? data.yFactor : (data.yFactor = path.bounds.y / path.bounds.height);
  const heightFactor = data.hFactor || (data.hFactor = (path.bounds.height + path.bounds.y) / path.bounds.height);
  path.data = data;
  return new Rectangle(
    path.bounds.x,
    path.bounds.y - path.bounds.height * yFactor,
    path.bounds.width,
    path.bounds.height * heightFactor
  );
}

async function start(firstLine: string, secondLine: string, flagRotation: number, translationsFile: string) {
  const mainFont = await loadFont("whoami/StalinistOne-Regular.ttf");
  const secondaryFontFamilies = await Promise.all(
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
  const translated = ((await Assets.load<string>(`whoami/translations/${translationsFile}`)) as string).split("\n");
  const translations = [
    ...translated,
    ...translated.map((s) => s.toLowerCase()),
    ...translated.map((s) => s.toUpperCase()),
  ];
  const sketchParams = {
    mainFont,
    secondaryFontFamilies,
    fallbackUnicodeFonts,
    flagRotation,
    firstLine,
    secondLine,
    translations,
  };
  new WhoAmI(sketchParams).draw();
}

void start("ХТО", "Я?", random(-45, 45), "who.txt");
//void start("ДЕ", "МИ?", 0, "where.txt");
//void start("ЩО", "ЦЕ?", 90, "what.txt");
