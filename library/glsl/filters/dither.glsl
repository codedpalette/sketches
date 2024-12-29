#include /utils/linear

// External constants
//  const int DITHER_LEVEL
//  const int PALETTE_SIZE

const float filterDim = pow(2.0, float(DITHER_LEVEL + 1));
const float filterSize = filterDim * filterDim;

uniform vec2 uTextureSize;
uniform float uSpread;
uniform vec3 uPalette[PALETTE_SIZE];

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
  vec2 pos = mod(uTextureSize * vTextureCoord, filterDim);
  int filterIndex = int(pos.x + pos.y * filterDim);
  if(level == 0) {
    return float(bayer2[filterIndex]) / filterSize;
  } else if(level == 1) {
    return float(bayer4[filterIndex]) / filterSize;
  } else {
    return float(bayer8[filterIndex]) / filterSize;
  }
}

vec3 fetchColor(int idx) {
  return uPalette[idx];
}

#include ./dither/regular
#include ./dither/yliluoma1
#include ./dither/yliluoma2

vec3 dither(vec3 color) {
  vec3 inputColor = color;
#ifdef LINEAR
  inputColor = toLinear(inputColor);
#endif
  vec3 result = DITHER_FUNC(inputColor);
#ifdef LINEAR
  result = fromLinear(result);
#endif
  return result;
}