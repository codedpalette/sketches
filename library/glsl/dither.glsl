uniform vec2 uTextureSize;
uniform float uSpread;
uniform int uLevel;
//uniform int uPaletteSize;
uniform vec3 uPalette[PALETTE_SIZE * PALETTE_SIZE * PALETTE_SIZE];

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

vec3 dither_acerola(vec3 color) {
  float numberOfColors = float(PALETTE_SIZE);
  float thresholdMap = indexValue(uLevel) - 0.5;
  vec3 ditheredColor = color + thresholdMap * uSpread;
  vec3 quantizedColor = floor((numberOfColors - 1.0) * ditheredColor + 0.5) / (numberOfColors - 1.0);
  return quantizedColor;
}

vec3 dither_yliluoma(vec3 color) {
  float thresholdMap = indexValue(uLevel) - 0.5;
  vec3 ditheredColor = color + thresholdMap * uSpread;
#ifdef LINEAR
  ditheredColor = toLinear(ditheredColor);
#endif

  vec3 closestColor = uPalette[0];
#ifdef LINEAR
  closestColor = toLinear(closestColor);
#endif
  float closestDistance = distance(ditheredColor, closestColor);
  for(int i = 1; i < uPalette.length(); i++) {
    vec3 attempt = uPalette[i];
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
  return dither_yliluoma(color);
  //return vec3(vTextureCoord * 2., 0.0);
}

// float dither(float color, float factor) {
//   float numberOfColors = float(uPaletteSize);
//   float thresholdMap = indexValue(uLevel) - 0.5;
//   float newColor = color + thresholdMap * uSpread * factor;
//   return floor((numberOfColors - 1.0) * newColor + 0.5) / (numberOfColors - 1.0);
// }

// float dither_linear(float color, float factor) {
//   float palette[3] = float[](0.0, 0.5, 1.0);
//   float thresholdMap = indexValue(uLevel) - 0.5;
//   float newColor = color + thresholdMap * uSpread;

//   float linearPalette0 = toLinear(vec3(palette[0])).x;
//   float closestColor = linearPalette0;
//   float closestDistance = distance(newColor, linearPalette0) * factor;
//   for(int i = 1; i < palette.length(); i++) {
//     float linearPalette = toLinear(vec3(palette[i])).x;
//     float dist = distance(newColor, linearPalette) * factor;
//     if(dist < closestDistance) {
//       closestColor = linearPalette;
//       closestDistance = dist;
//     }
//   }
//   return closestColor;
// }

// float weightedDistance(vec3 p1, vec3 p2, vec3 weight) {
//   float d1 = (p1.x - p2.x);
//   float d2 = (p1.y - p2.y);
//   float d3 = (p1.z - p2.z);
//   vec3 v = vec3(d1 * d1 * weight.x, d2 * d2 * weight.y, d3 * d3 * weight.z);
//   return v.x + v.y + v.z;
// }

// vec3 dither_linear(vec3 color) {
//   vec3 colorLinear = toLinear(color);
//   vec3 palette[5] = vec3[](vec3(0.0), vec3(0.8, 0.0, 0.0), vec3(0.7, 0.75, 0.0), vec3(0.0, 0.0, 0.68), vec3(0.1, 0.77, 0.23));
//   vec3 factor = vec3(0.2126, 0.7152, 0.0722);
//   //vec3 factor = vec3(1.0);

//   float thresholdMap = indexValue(uLevel) - 0.5;
//   vec3 newColor = colorLinear + thresholdMap * uSpread;

//   vec3 linearPalette0 = toLinear(palette[0]);
//   vec3 closestColor = linearPalette0;
//   float closestDistance = weightedDistance(newColor, linearPalette0, factor);

//   for(int i = 1; i < palette.length(); i++) {
//     vec3 linearPalette = toLinear(palette[i]);
//     float dist = weightedDistance(newColor, linearPalette, factor);
//     ;
//     if(dist <= closestDistance) {
//       closestColor = linearPalette;
//       closestDistance = dist;
//     }
//   }
//   return fromLinear(closestColor);

//   //vec3 factor = vec3(1.0);
//   //return fromLinear(vec3(dither_linear(colorLinear.r, factor.r), dither_linear(colorLinear.g, factor.g), dither_linear(colorLinear.b, factor.b)));
// }

// vec3 dither(vec3 color) {
//   // vec3 linearColor = toLinear(color);
//   // vec3 ditheredColor = vec3(dither(linearColor.r), dither(linearColor.g), dither(linearColor.b));
//   // return fromLinear(ditheredColor);
//   vec3 factor = vec3(1.0);
//   color = vec3(dither(color.r, factor.r), dither(color.g, factor.g), dither(color.b, factor.b));
// #ifdef LINEAR
//   color = dither_linear(color);  
// #endif
//   return color;
// }
