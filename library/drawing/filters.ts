import { filterFragTemplate, filterVertTemplate, glslNoise } from "drawing/shaders"
import { Filter } from "pixi.js"
import { Random } from "random"

export function noiseAlphaFilter(noiseScale = 1, random?: Random) {
  const fragShader = filterFragTemplate({
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
  return new Filter(filterVertTemplate(), fragShader, {
    noiseScale,
    noiseOffset: random?.realZeroToOneInclusive() ?? 0,
  })
}
