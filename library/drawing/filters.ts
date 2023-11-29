import { filterFragTemplate, filterVertTemplate, glslNoise } from "drawing/shaders"
import { Filter } from "pixi.js"
import { Random } from "random"

/**
 * Pixi.js filter for setting pixel opacity based on a noise value
 * @extends Filter
 */
export class NoiseAlphaFilter extends Filter {
  private static fragShader = filterFragTemplate({
    preamble: /*glsl*/ `
      uniform float noiseScale;
      uniform float noiseOffset;
      ${glslNoise}
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
      noiseScale,
      noiseOffset: random?.realZeroToOneInclusive() ?? 0,
    }
    super(filterVertTemplate(), NoiseAlphaFilter.fragShader, uniforms)
  }
}