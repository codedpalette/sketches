import { extractColors } from "extract-colors"
import { pixi } from "library/core/sketch"
import { DitherFilter, DownsampleFilter } from "library/drawing/filters"
import { asset } from "library/utils"
import { GUI } from "lil-gui"
import { Assets, Color, ColorMatrixFilter, Container, Filter, Sprite, Texture } from "pixi.js"
import { ConvolutionFilter } from "pixi-filters"

const texture = await Assets.load<Texture>(asset("dither/pic.jpg"))
const colors = await extractPalette()
const container = new Container()

const gui = new GUI()
const params = {
  sharpness: 0,
  brightness: 1,
  dither: {
    level: 0,
    spread: 0.1,
    paletteSize: 8,
    isLinear: false,
    method: "regular" as "regular" | "yliluoma1" | "yliluoma2",
  },
  downsample: {
    level: 0,
  },
}

gui.add(params, "sharpness", 0, 1)
gui.add(params, "brightness", 0, 2)

const ditherFolder = gui.addFolder("Dither")
ditherFolder.add(params.dither, "level", 0, 2, 1)
ditherFolder.add(params.dither, "spread", 0, 1)
ditherFolder.add(params.dither, "paletteSize", 2, 16, 1)
ditherFolder.add(params.dither, "isLinear")
ditherFolder.add(params.dither, "method", ["regular", "yliluoma1", "yliluoma2"])

const downsampleFolder = gui.addFolder("Downsample")
downsampleFolder.add(params.downsample, "level", 0, 2, 1)

gui.onChange(() => {
  const children = container.removeChildren()
  children.forEach((child) => child.destroy())
  process()
})

function process() {
  const spriteContainer = container.addChild(new Container())
  spriteContainer.scale.set(1, -1)

  const sprite = new Sprite(texture)
  const ditherParams = params.dither
  const downsampleParams = params.downsample
  const pipeline = [
    sharpen(params.sharpness),
    dither(ditherParams),
    brighten(params.brightness),
    downsample(downsampleParams.level),
  ]
  const output = pipeline.reduce((input, fn) => fn(input), sprite)
  output.anchor.set(0.5)
  spriteContainer.addChild(output)
}

export default pixi(() => {
  process()
  return { container }
})

function dither({ level, spread, isLinear, paletteSize, method }: (typeof params)["dither"]) {
  return (input: Sprite) => {
    const inputFilters = input.filters ? (input.filters as Filter[]) : []
    input.filters = [
      ...inputFilters,
      new DitherFilter({
        level,
        spread,
        isLinear,
        method,
        palette: colors.slice(0, paletteSize),
        inputSize: [input.width, input.height],
      }),
    ]
    return input
  }
}

function brighten(scale: number) {
  return (input: Sprite) => {
    const inputFilters = input.filters ? (input.filters as Filter[]) : []
    const brightnessFilter = new ColorMatrixFilter()
    brightnessFilter.brightness(scale, true)
    input.filters = [...inputFilters, brightnessFilter]
    return input
  }
}

function sharpen(sharpnessFactor: number) {
  return (input: Sprite) => {
    const inputFilters = input.filters ? (input.filters as Filter[]) : []
    input.filters = [
      ...inputFilters,
      new ConvolutionFilter({
        matrix: [
          0,
          -1 * sharpnessFactor,
          0,
          -1 * sharpnessFactor,
          4 * sharpnessFactor + 1,
          -1 * sharpnessFactor,
          0,
          -1 * sharpnessFactor,
          0,
        ],
        width: input.width,
        height: input.height,
      }),
    ]
    return input
  }
}

function downsample(level: number) {
  return (input: Sprite) => {
    const inputFilters = input.filters ? (input.filters as Filter[]) : []
    input.filters = [...inputFilters, new DownsampleFilter({ level, inputSize: [input.width, input.height] })]
    return input
  }
}

async function extractPalette() {
  const canvas = document.createElement("canvas")
  canvas.width = texture.width
  canvas.height = texture.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(texture.source.resource as ImageBitmap, 0, 0)
  const imageData = ctx.getImageData(0, 0, texture.width, texture.height)
  return (await extractColors(imageData, { distance: 0.01 })).map((color) => new Color(color.hex))
}
