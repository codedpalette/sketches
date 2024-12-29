import { dither } from "library/glsl"
import { Color, Filter, GlProgram } from "pixi.js"

import { filterFragTemplate, filterVertTemplate } from "../shaders"

interface DitherFilterOptions {
  level: number
  spread: number
  palette: number | Color[]
  isLinear: boolean
  inputSize: [number, number]
  method: "regular" | "yliluoma1" | "yliluoma2"
}

/**
 * Pixi.js filter for dithering
 */
export class DitherFilter extends Filter {
  /**
   * @param options - Dither filter options
   */
  constructor(options: DitherFilterOptions) {
    const paletteUniform = Array.isArray(options.palette) ? options.palette : generatePalette(options.palette)
    const uniforms = {
      uPalette: {
        value: paletteUniform.map((c) => (options.isLinear ? toLinear(c) : c)).flatMap((c) => c.toRgbArray()),
        type: "vec3<f32>",
        size: paletteUniform.length,
      },
      uSpread: { value: options.spread, type: "f32" },
      uTextureSize: { value: options.inputSize, type: "vec2<f32>" },
    }

    const glProgram = GlProgram.from({
      vertex: filterVertTemplate(),
      fragment: filterFragTemplate({
        preamble: /*glsl*/ `
          const int DITHER_LEVEL = ${options.level};
          const int PALETTE_SIZE = ${paletteUniform.length};
          #define ${options.method.toUpperCase()}
          ${options.isLinear ? "#define LINEAR" : ""}
          ${dither}
        `,
        main: /*glsl*/ `fragColor = vec4(dither(fragColor.rgb), 1.);`,
      }),
    })

    super({ glProgram, resources: { uniforms } })
  }
}

function generatePalette(colorsPerChannel: number): Color[] {
  const palette: Color[] = []
  for (let i = 0; i < colorsPerChannel; i++) {
    for (let j = 0; j < colorsPerChannel; j++) {
      for (let k = 0; k < colorsPerChannel; k++) {
        palette.push(new Color([i / (colorsPerChannel - 1), j / (colorsPerChannel - 1), k / (colorsPerChannel - 1)]))
      }
    }
  }
  return palette
}

function toLinear(color: Color): Color {
  const rgb = color.toRgbArray()
  const linearRgb = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  )
  return new Color(linearRgb)
}
