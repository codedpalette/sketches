import { Filter, GlProgram } from "pixi.js"

import { filterFragTemplate, filterVertTemplate } from "../shaders"

interface DownsampleFilterOptions {
  level: number
  inputSize: [number, number]
}

/**
 * Pixi.js filter for downsampling
 */
export class DownsampleFilter extends Filter {
  // Taken from https://github.com/pmndrs/postprocessing/blob/main/src/effects/PixelationEffect.js
  private static fragShader = filterFragTemplate({
    preamble: /*glsl*/ `
      uniform vec4 downsampleOffset;
      uniform bool isActive;              
    `,
    main: /*glsl*/ `
      if (isActive) {
        vec2 uv = downsampleOffset.xy * (floor(vTextureCoord * downsampleOffset.zw) + 0.5);
        fragColor = texture(uTexture, uv);
      }
    `,
  })

  /**
   *
   * @param options - Downsample filter options
   */
  constructor(options: DownsampleFilterOptions) {
    const x = options.level / options.inputSize[0]
    const y = options.level / options.inputSize[1]
    const uniforms = {
      downsampleOffset: { value: [x, y, 1 / x, 1 / y], type: "vec4<f32>" },
      isActive: { value: options.level, type: "i32" },
    }
    const glProgram = GlProgram.from({ vertex: filterVertTemplate(), fragment: DownsampleFilter.fragShader })
    super({ glProgram, resources: { uniforms } })
  }
}
