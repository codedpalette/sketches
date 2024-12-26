import { fxaa } from "library/glsl"
import { Filter, GlProgram } from "pixi.js"

import { filterFragTemplate, filterVertTemplate } from "../shaders"

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
