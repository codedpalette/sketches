#include /utils/linear

const float filterDim = pow(2.0, float(ditherLevel + 1));
const float filterSize = filterDim * filterDim;

uniform vec2 uTextureSize;
uniform float uSpread;
uniform highp sampler2D uPalette;
uniform int uPaletteDim;

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
  vec3 color = texelFetch(uPalette, ivec2(idx % uPaletteDim, idx / uPaletteDim), 0).rgb;  
#ifdef LINEAR
  color = toLinear(color);
#endif
  return color;
}

vec3 ditherRegular(vec3 color) {
  float thresholdMap = indexValue(ditherLevel) - 0.5;
  vec3 ditheredColor = color + thresholdMap * uSpread;
  vec3 closestColor = fetchColor(0);
  float closestDistance = distance(ditheredColor, closestColor);
  for(int i = 1; i < PALETTE_SIZE; i += 1) {
    vec3 attempt = fetchColor(i);
    float dist = distance(ditheredColor, attempt);
    if(dist < closestDistance) {
      closestColor = attempt;
      closestDistance = dist;
    }
  }
  return closestColor;
}

const vec3 lumaWeights = vec3(0.299, 0.587, 0.114);

float colorCompare(vec3 a, vec3 b) {
  float luma1 = dot(a, lumaWeights);
  float luma2 = dot(b, lumaWeights);
  float lumadiff = luma1 - luma2;
  vec3 diff = a - b;
  return dot(diff, diff * lumaWeights) * 0.75 + lumadiff * lumadiff;
}

float evaluateMixingError(vec3 desiredColor, vec3 mathMix, vec3 mixComponent1, vec3 mixComponent2, float mixRatio) {
  float mixDiff = colorCompare(desiredColor, mathMix);
  float mixComponentsDiff = colorCompare(mixComponent1, mixComponent2);
  return mixDiff + mixComponentsDiff * 0.1 * (abs(mixRatio - 0.5) + 0.5);
}

void deviseMixingPlan(in vec3 inputColor, out vec3 color1, out vec3 color2, out float ratio) {
  vec3 outColor1 = vec3(0., 0., 0.);
  vec3 outColor2 = vec3(0., 0., 0.);
  float outRatio = 0.;
  float leastPenalty = 1e99;
  float ratioDenominator = filterSize;
  for(int i = 0; i < PALETTE_SIZE; i++) {
    vec3 c1 = fetchColor(i);
    for(int j = i; j < PALETTE_SIZE; j++) {
      vec3 c2 = fetchColor(j);
      // float ratioNominator = ratioDenominator * 0.5;
      // if(c1 != c2) {
      //   // Determine the ratio of mixing for each channel.
      //   //   solve c1 + ratioNominator*(c2-c1)/ratioDenominator = inputColor for ratioNominator
      //   // Take a weighed average of these three ratios according to the
      //   // perceived luminosity of each channel (according to CCIR 601).
      //   vec3 solution = ratioDenominator * (inputColor - c1) / (c2 - c1);
      //   vec3 nonEquality = vec3(notEqual(c1, c2));
      //   ratioNominator = dot(lumaWeights * solution, nonEquality) / dot(lumaWeights, nonEquality);
      //   ratioNominator = round(clamp(ratioNominator, 0., ratioDenominator));
      // }
      // // Determine what mixing them in this proportion will produce
      // vec3 mixed = mix(c1, c2, ratioNominator / ratioDenominator);
      // float penalty = evaluateMixingError(inputColor, mixed, c1, c2, ratioNominator / ratioDenominator);
      // if(penalty < leastPenalty) {
      //   leastPenalty = penalty;
      //   color1 = c1;
      //   color2 = c2;
      //   ratio = ratioNominator / ratioDenominator;
      // }      
      float loopEnd = float(i != j) * ratioDenominator; // if (i == j ** ratioNominator != 0) break
      for(float ratioNominator = 0.; ratioNominator <= loopEnd; ratioNominator++) {
        vec3 mixed = mix(c1, c2, ratioNominator / ratioDenominator);
        float penalty = evaluateMixingError(inputColor, mixed, c1, c2, ratioNominator / ratioDenominator);
        // float isLess = float(penalty < leastPenalty);
        // leastPenalty = mix(leastPenalty, penalty, isLess);
        // outColor1 = mix(outColor1, c1, isLess);
        // outColor2 = mix(outColor2, c2, isLess);
        // outRatio = mix(outRatio, ratioNominator / ratioDenominator, isLess);
        if(penalty < leastPenalty) {
          leastPenalty = penalty;
          outColor1 = c1;
          outColor2 = c2;
          outRatio = ratioNominator / ratioDenominator;
        }
      }
    }
  }
  color1 = outColor1;
  color2 = outColor2;
  ratio = outRatio;
}

// Based on https://bisqwit.iki.fi/story/howto/dither/jy/
vec3 ditherYliluoma(vec3 color) {
  float thresholdMap = indexValue(ditherLevel);
  vec3 color1, color2;
  float ratio;
  deviseMixingPlan(color, color1, color2, ratio);
  return thresholdMap < ratio ? color2 : color1;
}

vec3[PALETTE_SIZE] deviseMixingPlan2(vec3 color) {
  vec3 plan[PALETTE_SIZE];
  //int planIdx[PALETTE_SIZE];
  vec3 soFar = vec3(0.);
  int proportionTotal = 0;

  while(proportionTotal < PALETTE_SIZE) {
    int chosenAmount = 1;
    int chosen = 0;
    int maxTestCount = max(1, proportionTotal);
    float leastPenalty = -1.0;
    for(int index = 0; index < PALETTE_SIZE; index++) {
      vec3 add = fetchColor(index);
      vec3 sum = vec3(soFar);
      for(int p = 1; p <= maxTestCount; p *= 2) {
        sum += add;
        add += add;
        float t = float(proportionTotal + p);
        vec3 test = sum / t;
        float penalty = colorCompare(color, test);
        if(penalty < leastPenalty || leastPenalty < 0.0) {
          leastPenalty = penalty;
          chosen = index;
          chosenAmount = p;
        }
      }
    }
    vec3 palColor = fetchColor(chosen);
    for(int p = 0; p < chosenAmount; p++) {
      if(proportionTotal >= PALETTE_SIZE)
        break;
      plan[proportionTotal] = palColor;
      proportionTotal++;
    }
    soFar += palColor * float(chosenAmount);
  }
  // TODO: Sort according to luminance
  return plan;
}

vec3 ditherYliluoma2(vec3 color) {
  float thresholdMap = indexValue(ditherLevel);
  vec3[PALETTE_SIZE] plan = deviseMixingPlan2(color);
  thresholdMap *= float(PALETTE_SIZE);
  return plan[int(thresholdMap)];
}

vec3 test_loop(vec3 color) {
  float ratioDenominator = filterSize;
  vec3 sum;
  for(int i = 0; i < PALETTE_SIZE; i++) {
    vec3 c1 = fetchColor(i);
    for(int j = i; j < PALETTE_SIZE; j++) {
      vec3 c2 = fetchColor(j);
      for(float ratioNominator = 0.; ratioNominator <= ratioDenominator; ratioNominator++) {
        sum += abs(c1 - c2);
      }
    }
  }
  return sum / (float(PALETTE_SIZE * PALETTE_SIZE) * ratioDenominator);
}

vec3 dither(vec3 color) {
  vec3 inputColor = color;
#ifdef LINEAR
  inputColor = toLinear(inputColor);
#endif
  vec3 result;
#ifdef YLILUOMA
  result = ditherYliluoma2(inputColor);
#else
  result = ditherRegular(inputColor);
#endif
#ifdef LINEAR
  result = fromLinear(result);
#endif
  return result;
}