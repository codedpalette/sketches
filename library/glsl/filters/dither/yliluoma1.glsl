#ifdef YLILUOMA1
#define DITHER_FUNC ditherYliluoma1

const vec3 lumaWeights = vec3(0.299, 0.587, 0.114);

float colorCompare(vec3 a, vec3 b) {
  float luma1 = dot(a, lumaWeights);
  float luma2 = dot(b, lumaWeights);
  float lumaDiff = luma1 - luma2;
  vec3 diff = a - b;
  return dot(diff, diff * lumaWeights) * 0.75 + lumaDiff * lumaDiff;
}

float evaluateMixingError(vec3 desiredColor, vec3 mathMix, vec3 mixComponent1, vec3 mixComponent2, float mixRatio) {
  float mixDiff = colorCompare(desiredColor, mathMix);
  float mixComponentsDiff = colorCompare(mixComponent1, mixComponent2);
  return mixDiff + mixComponentsDiff * 0.1 * (abs(mixRatio - 0.5) + 0.5);
}

void deviseMixingPlan(in vec3 inputColor, out vec3 color1, out vec3 color2, out float ratio) {
  vec3 outColor1 = vec3(0., 0., 0.);
  vec3 outColor2 = vec3(0., 0., 0.);
  float outRatio = 0.5;
  float leastPenalty = 1e99;
  for(int i = 0; i < PALETTE_SIZE; i++) {
    vec3 c1 = fetchColor(i);
    for(int j = i; j < PALETTE_SIZE; j++) {
      vec3 c2 = fetchColor(j);
      for(float ratioNominator = 0.; ratioNominator <= filterSize; ratioNominator++) {
        if(i == j && ratioNominator != 0.)
          break;
        vec3 mixed = mix(c1, c2, ratioNominator / filterSize);
        float penalty = evaluateMixingError(inputColor, mixed, c1, c2, ratioNominator / filterSize);
        bool penaltyLower = penalty < leastPenalty;
        leastPenalty = penaltyLower ? penalty : leastPenalty;
        outColor1 = penaltyLower ? c1 : outColor1;
        outColor2 = penaltyLower ? c2 : outColor2;
        outRatio = penaltyLower ? ratioNominator / filterSize : outRatio;
      }
    }
  }
  color1 = outColor1;
  color2 = outColor2;
  ratio = outRatio;
}

// Based on https://bisqwit.iki.fi/story/howto/dither/jy/
vec3 ditherYliluoma1(vec3 color) {
  float thresholdMap = indexValue(DITHER_LEVEL);
  vec3 color1, color2;
  float ratio;
  deviseMixingPlan(color, color1, color2, ratio);
  return thresholdMap < ratio ? color2 : color1;
}

#endif