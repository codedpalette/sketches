import { drawLines, drawPath, LineLike } from "drawing/pixi";
import { init, run } from "drawing/sketch";
import { Color, CompoundPath, Point, Rectangle } from "geometry";
import { concavePacking } from "packing/concave";
import { Assets, Container, Graphics } from "pixi.js";
import { Font, loadFont, textToPath } from "util/font";
import { random } from "util/random";

interface FontFamily {
  regular: Font;
  bold: Font;
  italic: Font;
  boldItalic: Font;
}

interface TextParams {
  mainFont: Font;
  secondaryFontFamilies: FontFamily[];
  fallbackUnicodeFonts: Font[];
  translations: Set<string>;
}

const nTexts = 500;
const lineHeight = 300;
const lineSpacing = 50;
const margin = 10;
const [firstLine, secondLine, translationsFile, flagRotation] = ["ХТО", "Я?", "who.txt", random.integer(-45, 45)];
//const [firstLine, secondLine, translationsFile, flagRotation] = ["ДЕ", "МИ?", "where.txt", 0];
//const [firstLine, secondLine, translationsFile, flagRotation] = ["ЩО", "ЦЕ?", "what.txt", 90];
const params = init();
const { background, foreground } = createFlag();

void loadTextParams(translationsFile).then((textParams) => {
  const container = new Container();
  const mainPaths = generateMainText(textParams.mainFont);
  !params.debug && container.addChild(background);
  container.addChild(drawMainText(mainPaths));
  container.addChild(generateSecondaryTexts(mainPaths, textParams));
  run({ container }, params);
});

function generateMainText(mainFont: Font): CompoundPath[] {
  const xStart = -params.width / 2 + margin;
  return [firstLine, secondLine].flatMap((line, lineIdx) => {
    const y = lineIdx == 0 ? lineSpacing + lineHeight / 2 : -lineSpacing - lineHeight / 2;
    const lineWidth = params.width - 2 * margin;
    const xStep = lineWidth / line.length;

    return [...line].map((char, charIdx) => {
      const x = xStart + xStep * (charIdx + 0.5);
      return generateMainGlyph(mainFont, x, y, char);
    });
  });
}

function generateMainGlyph(mainFont: Font, x: number, y: number, char: string): CompoundPath {
  const path = textToPath(char, mainFont, true) as CompoundPath; // Can't be undefined for mainFont
  const boundingBox = calculateGlyphBoundingBox(path);
  const scaleX = lineHeight / boundingBox.width;
  const scaleY = lineHeight / boundingBox.height;

  path.translate([-boundingBox.width / 2, -boundingBox.height / 2]);
  path.scale(scaleX, scaleY, [0, 0]);
  path.translate([x, y]);
  return path;
}

function drawMainText(mainPaths: CompoundPath[]): Container {
  const container = new Container();
  const pathSteps = params.debug ? 1 : 10;
  const alphaStep = (1 - 0.5) / pathSteps;

  params.debug && container.addChild(drawBaselines());
  for (const path of mainPaths) {
    const graphics = new Graphics();
    if (params.debug) {
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

function drawBaselines(): Graphics {
  const graphics = new Graphics().lineStyle(1, 0xff0000);
  const lines: LineLike[] = [
    [-params.width / 2, lineSpacing, params.width / 2, lineSpacing],
    [-params.width / 2, lineSpacing + lineHeight, params.width / 2, lineSpacing + lineHeight],
    [-params.width / 2, -lineSpacing, params.width / 2, -lineSpacing],
    [-params.width / 2, -lineSpacing - lineHeight, params.width / 2, -lineSpacing - lineHeight],
    [-params.width / 2 + margin, params.height / 2, -params.width / 2 + margin, -params.height / 2],
    [params.width / 2 - margin, params.height / 2, params.width / 2 - margin, -params.height / 2],
  ];
  drawLines(lines, graphics);
  return graphics;
}

function textPathsFactory(params: TextParams): CompoundPath {
  const allFontVariants = params.secondaryFontFamilies.flatMap((ff) => [ff.regular, ff.bold, ff.italic, ff.boldItalic]);
  for (;;) {
    const text = random.pick(Array.from(params.translations.values()));
    const textPath =
      textToPath(text, random.pick(allFontVariants)) ||
      textToPath(text, random.pick(params.fallbackUnicodeFonts)) ||
      void params.translations.delete(text);
    if (textPath) return textPath;
  }
}

function generateSecondaryTexts(mainPaths: CompoundPath[], textParams: TextParams): Container {
  const textPathsObservable = concavePacking(() => textPathsFactory(textParams), {
    boundingRect: new Rectangle(-params.width / 2, params.height / 2, params.width, -params.height),
    nShapes: nTexts,
    blacklistShape: new CompoundPath(mainPaths),
    randomizeParams: { rotationBounds: [-20, 20], skewBounds: { horizontal: [-5, 5], vertical: [-5, 5] } },
  });

  const maskContainer = new Container();
  const mask = new Graphics();
  if (!params.debug) {
    maskContainer.mask = mask;
    maskContainer.addChild(mask);
    maskContainer.addChild(foreground);
  }

  textPathsObservable.subscribe((path) => {
    if (params.debug) {
      path.strokeColor = new Color("blue");
      maskContainer.addChild(drawPath(path));
    } else {
      path.fillColor = new Color("white");
      mask.addChild(drawPath(path));
    }
  });
  return maskContainer;
}

function createFlag(): { background: Graphics; foreground: Graphics } {
  const blue = 0x0057b7;
  const yellow = 0xffd700;
  // Setup control points for a flag curve
  const [cpt1, cpt2] = [
    new Point([random.integer(-params.width / 2, 0), random.integer(0, params.height / 2)]),
    new Point([random.integer(0, params.width / 2), random.integer(-params.height / 2, 0)]),
  ];

  const flipColors = random.bool();
  const [background, foreground] = [flipColors, !flipColors].map((isBackground) => {
    const graphics = new Graphics()
      .beginFill(isBackground ? blue : yellow) // Fill background
      .drawRect(-params.width, -params.height, params.width * 2, params.height * 2)
      .endFill()
      .beginFill(isBackground ? yellow : blue) // Fill area under the curve
      .moveTo(-params.width, -params.height)
      .lineTo(-params.width, 0)
      .bezierCurveTo(cpt1.x, cpt1.y, cpt2.x, cpt2.y, params.width, 0)
      .lineTo(params.width, -params.height)
      .closePath();
    graphics.angle = flagRotation;
    return graphics;
  });
  return { background, foreground };
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

async function loadTextParams(translationsFile: string): Promise<TextParams> {
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
  const translations = new Set([
    ...translated,
    ...translated.map((s) => s.toLowerCase()),
    ...translated.map((s) => s.toUpperCase()),
  ]);
  return {
    mainFont,
    secondaryFontFamilies,
    fallbackUnicodeFonts,
    translations,
  };
}
