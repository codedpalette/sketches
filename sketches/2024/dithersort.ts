import { extractColors } from "extract-colors"
import { pixi } from "library/core/sketch"
import { filterFragTemplate, filterVertTemplate } from "library/drawing/shaders"
import { dither as ditherFrag } from "library/glsl"
import { asset } from "library/utils"
import {
  Assets,
  BufferImageSource,
  Color,
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
const colors = await extractPalette()

let _count = 0

export default pixi(({ renderer }) => {
  const container = new Container()
  const spriteContainer = container.addChild(new Container())
  spriteContainer.scale.set(1, -1)

  const sprite = new Sprite(texture)

  const ditherLevel = 1 // 0-2
  const ditherSpread = 0.1
  const paletteSize = 4
  const sharpnessFactor = 0
  const downsampleLevel = 0
  const brightness = 1
  const pipeline =
    _count % 5 == 0
      ? []
      : [
          sharpen(sharpnessFactor),
          dither(ditherLevel, ditherSpread, paletteSize, false),
          downsample(downsampleLevel),
          brighten(brightness),
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

function dither(level: number, spread: number, paletteSize: number, extractPalette: boolean) {
  function generatePalette() {
    const palette: Color[] = !extractPalette
      ? []
      : colors
          .sort((a, b) => a.area - b.area)
          .slice(0, paletteSize)
          .map((c) => new Color(c.hex))
    if (!extractPalette) {
      for (let i = 0; i < paletteSize; i++) {
        for (let j = 0; j < paletteSize; j++) {
          for (let k = 0; k < paletteSize; k++) {
            palette.push(new Color([i / (paletteSize - 1), j / (paletteSize - 1), k / (paletteSize - 1)]))
          }
        }
      }
    }
    const paletteLength = palette.length
    const paletteSquareDim = Math.sqrt(paletteLength)
    const closestPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(paletteSquareDim)))
    console.log(`paletteLength=${paletteLength}, texture dimensions=${closestPowerOfTwo}x${closestPowerOfTwo}`)

    //TODO: Maybe interleave colors with float32
    //TODO: Instanced rendering
    const bufferLength = closestPowerOfTwo * closestPowerOfTwo * 4
    const paletteBuffer = Object.assign(
      new Array(bufferLength).fill(0, 0, bufferLength),
      palette.flatMap((c) => c.toArray()).map((v) => v * 255)
    )
    const bufferSource = new BufferImageSource({
      resource: new Uint8Array(paletteBuffer),
      width: closestPowerOfTwo,
      height: closestPowerOfTwo,
      format: "rgba8unorm",
      scaleMode: "nearest",
    })
    return {
      paletteLength,
      uPalette: bufferSource,
      uniforms: {
        uPaletteDim: { value: closestPowerOfTwo, type: "i32" },
      },
    }
  }
  return (input: Sprite) => {
    const inputFilters = input.filters ? (input.filters as Filter[]) : []
    const { uPalette, uniforms, paletteLength } = generatePalette()
    input.filters = [
      ...inputFilters,
      new Filter({
        glProgram: GlProgram.from({
          vertex: filterVertTemplate(),
          fragment: filterFragTemplate({
            preamble: /*glsl*/ `
              ${_count % 5 == 2 || _count % 5 == 4 ? "#define LINEAR" : ""}
              ${_count % 5 == 3 || _count % 5 == 4 ? "#define YLILUOMA" : ""}
              #define PALETTE_SIZE ${paletteLength}
              const int ditherLevel = ${level};
              ${ditherFrag}
            `,
            main: /*glsl*/ `fragColor = vec4(dither(fragColor.rgb), 1.);`,
          }),
        }),
        resources: {
          uPalette,
          uniforms: {
            ...uniforms,
            uSpread: { value: spread, type: "f32" },
            uTextureSize: { value: [input.width, input.height], type: "vec2<f32>" },
          },
        },
      }),
    ]
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
  return await extractColors(imageData, { distance: 0.01 })
}
