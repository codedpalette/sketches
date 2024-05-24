uniform vec4 uOutputTexture;
uniform int uLevel;
uniform float uSpread;
uniform int uPaletteSize;

// prettier-ignore
const int bayer2[4] = int[](0, 2, 
/**/                        3, 1);
const int bayer4[16] = int[](0, 8, 2, 10, 
/**/                         12, 4, 14, 6, 
/**/                         3, 11, 1, 9, 
/**/                         15, 7, 13, 5);

const int bayer8[64] = int[](0, 32, 8, 40, 2, 34, 10, 42, 
/**/                         48, 16, 56, 24, 50, 18, 58, 26, 
/**/                         12, 44, 4, 36, 14, 46, 6, 38, 
/**/                         60, 28, 52, 20, 62, 30, 54, 22, 
/**/                         3, 35, 11, 43, 1, 33, 9, 41, 
/**/                         51, 19, 59, 27, 49, 17, 57, 25, 
/**/                         15, 47, 7, 39, 13, 45, 5, 37, 
/**/                         63, 31, 55, 23, 61, 29, 53, 21);

float indexValue(int level) {
  float filterSize = pow(2.0, float(level + 1));
  int x = int(mod(uOutputTexture.x * vTextureCoord.x, filterSize));
  int y = int(mod(uOutputTexture.y * vTextureCoord.y, filterSize));
  int filterIndex = x + y * int(filterSize);
  if(level == 0) {
    return float(bayer2[filterIndex]) / 4.0;
  } else if(level == 1) {
    return float(bayer4[filterIndex]) / 16.0;
  } else {
    return float(bayer8[filterIndex]) / 64.0;
  }
}

float dither(float color) {
  float numberOfColors = float(uPaletteSize);
  float thresholdMap = indexValue(uLevel) - 0.5;
  float newColor = color + thresholdMap * uSpread;
  return floor((numberOfColors - 1.0) * newColor + 0.5) / (numberOfColors - 1.0);
}

// TODO: move these to a shared file
// Converts a color from linear light gamma to sRGB gamma
vec3 fromLinear(vec3 linearRGB) {
  bvec3 cutoff = lessThan(linearRGB, vec3(0.0031308));
  vec3 higher = vec3(1.055) * pow(linearRGB, vec3(1.0 / 2.4)) - vec3(0.055);
  vec3 lower = linearRGB * vec3(12.92);

  return mix(higher, lower, cutoff);
}

// Converts a color from sRGB gamma to linear light gamma
vec3 toLinear(vec3 sRGB) {
  bvec3 cutoff = lessThan(sRGB, vec3(0.04045));
  vec3 higher = pow((sRGB + vec3(0.055)) / vec3(1.055), vec3(2.4));
  vec3 lower = sRGB / vec3(12.92);

  return mix(higher, lower, cutoff);
}

vec3 dither(vec3 color) {
  // vec3 linearColor = toLinear(color);
  // vec3 ditheredColor = vec3(dither(linearColor.r), dither(linearColor.g), dither(linearColor.b));
  // return fromLinear(ditheredColor);

#ifdef LINEAR
  color = toLinear(color);
#endif
  color = vec3(dither(color.r), dither(color.g), dither(color.b));
#ifdef LINEAR
  color = fromLinear(color);
#endif
  return color;
}