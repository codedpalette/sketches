#include /utils/linear

uniform vec2 uTextureSize;
uniform float uSpread;
uniform int uLevel;
uniform highp sampler2D uPalette;

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
  vec2 pos = mod(uTextureSize * vTextureCoord, filterSize);
  int filterIndex = int(pos.x + pos.y * filterSize);
  if(level == 0) {
    return float(bayer2[filterIndex]) / 4.0;
  } else if(level == 1) {
    return float(bayer4[filterIndex]) / 16.0;
  } else {
    return float(bayer8[filterIndex]) / 64.0;
  }
}

vec3 dither_regular(vec3 color) {
  float thresholdMap = indexValue(uLevel) - 0.5;
  vec3 ditheredColor = color + thresholdMap * uSpread;
#ifdef LINEAR
  ditheredColor = toLinear(ditheredColor);
#endif

  vec3 closestColor = texelFetch(uPalette, ivec2(0, 0), 0).rgb;
#ifdef LINEAR
  closestColor = toLinear(closestColor);
#endif
  float closestDistance = distance(ditheredColor, closestColor);
  for(int i = 1; i < PALETTE_SIZE; i += 1) {
    vec3 attempt = texelFetch(uPalette, ivec2(i, 0), 0).rgb;
#ifdef LINEAR
    attempt = toLinear(attempt);
#endif
    float dist = distance(ditheredColor, attempt);
    if(dist < closestDistance) {
      closestColor = attempt;
      closestDistance = dist;
    }
  }
#ifdef LINEAR
  closestColor = fromLinear(closestColor);
#endif
  return closestColor;
}

vec3 dither(vec3 color) {
  return dither_regular(color);
}