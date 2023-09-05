import { ShaderModule } from "@use-gpu/shader"
import { bindBundle, bindEntryPoint, glsl, int } from "@use-gpu/shader/glsl"

const colorGlsl = glsl`  
  // https://bottosson.github.io/posts/colorwrong/#what-can-we-do%3F
  #pragma export
  vec3 toLinear(vec3 col) {
    vec3 linear = vec3(0.0);
    for(int i = 0; i < 3; i ++ ) {
      float x = col[i];
      linear[i] = x >= 0.04045 ? pow((x + 0.055) / 1.055, 2.4) : x / 12.92;
    }
    return linear;
  }

  #pragma export
  vec3 toSrgb(vec3 col) {
    vec3 srgb = vec3(0.0);
    for(int i = 0; i < 3; i ++ ) {
      float x = col[i];
      srgb[i] = x >= 0.0031308 ? 1.055 * pow(x, 1.0 / 2.4) - 0.055 : x * 12.92;
    }
    return srgb;
  }
`
export const color = {
  toLinear: bindEntryPoint(colorGlsl, "toLinear"),
  toSrgb: bindEntryPoint(colorGlsl, "toSrgb"),
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const oklabGlsl = glsl`
  vec3 toLinear(vec3 col);
  vec3 toSrgb(vec3 col);

  #pragma export
  // https://www.shadertoy.com/view/ttcyRS
  vec3 oklab_mix(vec3 colA, vec3 colB, float h) {
    const mat3 kCONEtoLMS = mat3(
      0.4121656120, 0.2118591070, 0.0883097947,
      0.5362752080, 0.6807189584, 0.2818474174,
      0.0514575653, 0.1074065790, 0.6302613616
    );
    const mat3 kLMStoCONE = mat3(
      4.0767245293, - 1.2681437731, - 0.0041119885,
      - 3.3072168827, 2.6093323231, - 0.7034763098,
      0.2307590544, - 0.3411344290, 1.7068625689
    );
    
    vec3 lmsA = pow(kCONEtoLMS * toLinear(colA), vec3(1.0 / 3.0));
    vec3 lmsB = pow(kCONEtoLMS * toLinear(colB), vec3(1.0 / 3.0));
    vec3 lms = mix(lmsA, lmsB, h);
    // gain in the middle (no oklab anymore, but looks better?)
    lms *= 1.0 + 0.2 * h * (1.0 - h);
    return toSrgb(kLMStoCONE * (lms * lms * lms));
  }
`

export const oklab = {
  mix: bindBundle(bindEntryPoint(oklabGlsl, "oklab_mix"), color),
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const gradientGlsl = (paletteSize: number) => glsl`  

  vec3 mixFunction(vec3 startColor, vec3 endColor, float t);    

  vec3 paletteMix(float t, vec4 palette[${int(paletteSize)}]) {
    for(int i = 0; i < palette.length(); i ++ ) {
      if (t > palette[i].w && t < palette[i + 1].w) {
        vec3 startColor = palette[i].rgb;
        vec3 endColor = palette[i + 1].rgb;
        float t_scaled = (t - palette[i].w) / (palette[i + 1].w - palette[i].w);
        return mixFunction(startColor, endColor, t_scaled);
      }
    }
  }

  #pragma export
  vec3 conic(vec2 position, vec2 gradientCenter, float gradientRotation, vec4 palette[${int(paletteSize)}]) {
    vec2 relative = position - gradientCenter;
    float angle = atan(relative.y, relative.x);
    float t = mod(angle - gradientRotation + PI, 2.0 * PI) / (2.0 * PI);
    return paletteMix(t, palette);
  }
 
  #pragma export
  vec3 linear(float t, vec4 palette[${int(paletteSize)}]) {
    return paletteMix(t, palette);
  }
`

const defaultMixFunction = glsl`
  #pragma export
  vec3 main(vec3 startColor, vec3 endColor, float t) {
    return mix(startColor, endColor, t);
  }
`

export function gradient(paletteSize: number, mixFunction: ShaderModule = defaultMixFunction) {
  return {
    conic: bindBundle(bindEntryPoint(gradientGlsl(paletteSize), "conic"), { mixFunction }),
    linear: bindBundle(bindEntryPoint(gradientGlsl(paletteSize), "linear"), { mixFunction }),
  }
}

export const oklabGradient = (paletteSize: number) => gradient(paletteSize, oklab.mix)
