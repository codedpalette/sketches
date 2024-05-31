import { Random } from "library/core/random"
import { filterFragTemplate, filterVertTemplate } from "library/drawing/shaders"
import { fxaa, glNoise3d } from "library/glsl"
import { Filter, GlProgram } from "pixi.js"

/**
 * Pixi.js filter for setting pixel opacity based on a noise value
 */
export class NoiseAlphaFilter extends Filter {
  private static fragShader = filterFragTemplate({
    preamble: /*glsl*/ `
      uniform float noiseScale;
      uniform float noiseOffset;      
      ${glNoise3d}
    `,
    main: /*glsl*/ `
      float n = snoise(vec3(vTextureCoord, noiseOffset) * noiseScale);
      fragColor *= step(0.5, abs(n));
    `,
  })

  /**
   * Creates {@link NoiseAlphaFilter}
   * @param noiseScale Scale factor for noise sampling coordinates (lower values mean smoother noise)
   * @param random {@link Random} instance for generating random noise sampling offset
   */
  constructor(noiseScale = 1, random?: Random) {
    const uniforms = {
      noiseScale: { value: noiseScale, type: "f32" },
      noiseOffset: { value: random?.realZeroToOneInclusive() ?? 0, type: "f32" },
    }
    const glProgram = GlProgram.from({ vertex: filterVertTemplate(), fragment: NoiseAlphaFilter.fragShader })
    super({ glProgram, resources: { uniforms } })
  }
}

/**
 * Pixi.js filter for FXAA (Fast Approximate Anti-Aliasing)
 */
export class FXAAFilter extends Filter {
  private static fragShader = filterFragTemplate({
    preamble: /*glsl*/ `${fxaa}
      uniform vec4 uOutputFrame;
    `,
    main: /*glsl*/ `
      vec2 resolution = uOutputFrame.zw;
      fragColor = applyFXAA(vTextureCoord * resolution, resolution, uTexture);
    `,
  })

  /** Creates {@link FXAAFilter} */
  constructor() {
    const glProgram = GlProgram.from({ vertex: filterVertTemplate(), fragment: FXAAFilter.fragShader })
    super({ glProgram })
  }
}
