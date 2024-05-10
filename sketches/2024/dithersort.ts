import { pixi } from "library/core/sketch"
import { ICanvas } from "library/core/types"
import { filterFragTemplate, filterVertTemplate } from "library/drawing/shaders"
import { asset } from "library/utils"
import { Assets, Container, Filter, GlProgram, RenderTexture, Sprite, Texture, WebGLRenderer } from "pixi.js"

const texture = await Assets.load<Texture>(asset("dither/pic.jpg"))

export default pixi(({ renderer }) => {
  console.trace("dithersort")
  const sprite = new Sprite(texture)
  const container = new Container()
  const downsampled = downsample(sprite, 1, renderer)
  downsampled.filters = [new DitherFilter()]
  container.addChild(downsampled)
  return { container }

  function downsample(sprite: Sprite, level: number, renderer: WebGLRenderer<ICanvas>) {
    sprite.scale.set(Math.pow(2, -level))
    const renderTexture = RenderTexture.create({ width: sprite.width, height: sprite.height, scaleMode: "nearest" })
    const rendererSize = [renderer.width, renderer.height]
    renderer.resize(renderTexture.width, renderTexture.height)
    renderer.render({ container: sprite, target: renderTexture })
    renderer.resize(rendererSize[0], rendererSize[1])
    const downsampled = new Sprite(renderTexture)
    downsampled.anchor.set(0.5)
    const scale = Math.pow(2, level)
    downsampled.scale.set(scale, -scale)
    return downsampled
  }
})

class DitherFilter extends Filter {
  private static fragShader = filterFragTemplate({
    preamble: /*glsl*/ `
      #define PALETTE_SIZE 2
      const int indexMatrix4x4[16] = int[](
        0,  8,  2,  10,
        12, 4,  14, 6,
        3,  11, 1,  9,
        15, 7,  13, 5
      );
      const vec3 palette[PALETTE_SIZE] = vec3[](
        vec3(0.886, 0., 0.137),
        vec3(1., 0.933, 0.172)
      );

      float indexValue() {
        int x = int(mod(gl_FragCoord.x, 4.));
        int y = int(mod(gl_FragCoord.y, 4.));
        return float(indexMatrix4x4[(x + y * 4)]) / 16.0;
      }

      vec3[2] closestColors(vec3 color) {
        vec3 ret[2];
        vec3 closest = vec3(-2., 0., 0.);
        vec3 secondClosest = vec3(-2., 0., 0.);
        vec3 temp;
        for (int i = 0; i < PALETTE_SIZE; ++i) {
            temp = palette[i];
            float tempDistance = distance(temp, color);
            if (tempDistance < distance(closest, color)) {
                secondClosest = closest;
                closest = temp;
            } else {
                if (tempDistance < distance(secondClosest, color)) {
                    secondClosest = temp;
                }
            }
        }
        ret[0] = closest;
        ret[1] = secondClosest;
        return ret;
      }

      vec3 dither(vec3 color) {
        vec3[2] colors = closestColors(color);
        vec3 closestColor = colors[0];
        vec3 secondClosestColor = colors[1];
        float d = indexValue();
        float normalizedDistance = distance(color, closestColor) / distance(closestColor, secondClosestColor);
        return (normalizedDistance < d) ? closestColor : secondClosestColor;        
      }
    `,
    main: /*glsl*/ `
      fragColor = vec4(dither(fragColor.rgb), 1.);      
    `,
  })
  constructor() {
    const uniforms = {
      // noiseScale: { value: noiseScale, type: "f32" },
      // noiseOffset: { value: random?.realZeroToOneInclusive() ?? 0, type: "f32" },
    }
    const glProgram = new GlProgram({ vertex: filterVertTemplate(), fragment: DitherFilter.fragShader })
    super({ glProgram, resources: { uniforms } })
  }
}
