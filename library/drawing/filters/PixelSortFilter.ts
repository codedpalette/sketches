import { pixelsort } from "library/glsl"
import {
  Filter,
  FilterSystem,
  GlProgram,
  RenderSurface,
  Texture,
  TexturePool,
  UniformData,
  UniformGroup,
} from "pixi.js"

import { filterFragTemplate, filterVertTemplate } from "../shaders"

interface PixelSortFilterOptions {
  threshold: [number, number]
  direction: "horizontal" | "vertical"
  invert: boolean
}

/**
 * Pixi.js filter for pixel sorting
 */
export class PixelSortFilter extends Filter {
  private tempTexture1?: Texture
  private tempTexture2?: Texture
  private frame = 0
  private outputPass = Filter.from({ gl: { vertex: filterVertTemplate(), fragment: filterFragTemplate() } })
  /**
   * @param options - Pixel sort filter options
   */
  constructor(options: PixelSortFilterOptions) {
    const uniforms = {
      uThreshold: { value: options.threshold, type: "vec2<f32>" },
      uDirection: { value: options.direction === "horizontal" ? [1, 0] : [0, 1], type: "vec2<f32>" },
      uFrame: { value: 0, type: "i32" },
      uInvert: { value: options.invert ? 1 : 0, type: "i32" },
    }
    const glProgram = GlProgram.from({
      vertex: filterVertTemplate({
        preamble: /*glsl*/ `
          out vec2 vPosition;
        `,
        main: /*glsl*/ `
          vPosition = aPosition;
        `,
      }),
      fragment: filterFragTemplate({
        preamble: /*glsl*/ `          
          ${pixelsort}
        `,
        main: /*glsl*/ `fragColor = vec4(sort(fragColor.rgb), 1.);`,
      }),
    })

    super({ glProgram, resources: { uniforms } })
  }

  /**
   * Applies the filter
   * @param filterManager - The renderer to retrieve the filter from
   * @param input - The input render target.
   * @param output - The target to output to.
   * @param clearMode - Should the output be cleared before rendering to it
   */
  // TODO: Can we render it in one pass?
  // Check when to stop by comparing the input and output or with occlusion queries
  // Or come up with a different strategy altogether
  apply(filterManager: FilterSystem, input: Texture, output: RenderSurface, clearMode: boolean): void {
    this.tempTexture1 = this.tempTexture1 ?? TexturePool.getSameSizeTexture(input)
    this.tempTexture2 = this.tempTexture2 ?? TexturePool.getSameSizeTexture(input)
    const tempTextures = [this.tempTexture1, this.tempTexture2]
    const inputTexture = this.frame === 0 ? input : tempTextures[(this.frame - 1) % 2]
    const outputTexture = tempTextures[this.frame % 2]
    super.apply(filterManager, inputTexture, outputTexture, false)
    this.outputPass.apply(filterManager, outputTexture, output, clearMode)
    this.frame++
    ;(this.resources.uniforms as UniformGroup<{ uFrame: UniformData }>).uniforms.uFrame = this.frame
  }
}
