import { pixi } from "library/core/sketch"
import { dither as ditherFrag, filterFragTemplate, filterVertTemplate } from "library/drawing/shaders"
import { asset } from "library/utils"
import {
  Assets,
  ColorMatrixFilter,
  Container,
  Filter,
  GlProgram,
  RenderTexture,
  SCALE_MODE,
  Sprite,
  Texture,
} from "pixi.js"
import { ConvolutionFilter } from "pixi-filters"

const texture = await Assets.load<Texture>(asset("dither/pic.jpg"))

let _count = 0

export default pixi(({ renderer }) => {
  const container = new Container()
  const spriteContainer = container.addChild(new Container())
  spriteContainer.scale.set(1, -1)

  const sprite = new Sprite(texture)

  const ditherLevel = 1 // 0-2
  const ditherSpread = 0.1 // 0-1
  const paletteSize = 4 // 2-16
  const sharpnessFactor = 0.5 // 0-1
  const downsampleLevel = 1
  const _grayScale = 0.5 // 0-1
  const pipeline =
    _count % 3 == 0
      ? []
      : [
          //grayscale(grayScale),
          sharpen(sharpnessFactor),
          dither(ditherLevel, ditherSpread, paletteSize),
          downsample(downsampleLevel),
        ]
  const output = pipeline.reduce((input, fn) => fn(input), sprite)
  output.anchor.set(0.5)
  spriteContainer.addChild(output)

  _count++
  return { container }

  function downsample(level: number) {
    return (input: Sprite) => {
      const scale = Math.pow(2, level)
      const sourceScaleMode: SCALE_MODE = "nearest"
      const targetScaleMode: SCALE_MODE = "nearest"

      const sprite = new Sprite(input.texture)
      sprite.filters = input.filters
      sprite.texture.source.scaleMode = sourceScaleMode
      sprite.texture.source.style.update()
      sprite.scale.set(1 / scale)

      const renderTexture = RenderTexture.create({
        width: sprite.width,
        height: sprite.height,
        scaleMode: targetScaleMode,
      })
      const rendererSize = [renderer.width, renderer.height]
      renderer.resize(renderTexture.width, renderTexture.height)
      renderer.render({ container: sprite, target: renderTexture })
      renderer.resize(rendererSize[0], rendererSize[1])

      const downsampled = new Sprite(renderTexture)
      downsampled.scale.set(scale)
      return downsampled
    }
  }
})

function _grayscale(scale: number) {
  return (input: Sprite) => {
    const inputFilters = input.filters ? (input.filters as Filter[]) : []
    const grayscaleFilter = new ColorMatrixFilter()
    grayscaleFilter.grayscale(scale, true)
    input.filters = [...inputFilters, grayscaleFilter]
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

function dither(level: number, spread: number, paletteSize: number) {
  function generatePalette() {
    const palette: [number, number, number][] = []
    for (let i = 0; i < paletteSize; i++) {
      for (let j = 0; j < paletteSize; j++) {
        for (let k = 0; k < paletteSize; k++) {
          palette.push([i / (paletteSize - 1), j / (paletteSize - 1), k / (paletteSize - 1)])
        }
      }
    }
    return palette.flat()
  }
  return (input: Sprite) => {
    const inputFilters = input.filters ? (input.filters as Filter[]) : []
    input.filters = [
      ...inputFilters,
      new Filter({
        glProgram: GlProgram.from({
          vertex: filterVertTemplate(),
          fragment: filterFragTemplate({
            preamble: /*glsl*/ `
              ${_count % 3 == 2 ? "#define LINEAR" : ""}
              #define PALETTE_SIZE ${paletteSize}
              ${ditherFrag}
            `,
            main: /*glsl*/ `fragColor = vec4(dither(fragColor.rgb), 1.);`,
          }),
        }),
        resources: {
          uniforms: {
            uLevel: { value: level, type: "i32" },
            uSpread: { value: spread, type: "f32" },
            // TODO: Pass as texture
            // https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
            uPalette: {
              value: generatePalette(),
              type: "vec3<f32>",
              size: paletteSize * paletteSize * paletteSize,
            },
            uTextureSize: { value: [input.width, input.height], type: "vec2<f32>" },
          },
        },
      }),
    ]
    return input
  }
}
