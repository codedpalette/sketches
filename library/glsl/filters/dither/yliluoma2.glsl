#ifdef YLILUOMA2
#define DITHER_FUNC ditherYliluoma2

const vec3 lumaWeights = vec3(0.299, 0.587, 0.114);
float lumaPalette[PALETTE_SIZE];

float colorCompare(vec3 a, vec3 b) {
  float luma1 = dot(a, lumaWeights);
  float luma2 = dot(b, lumaWeights);
  float lumaDiff = luma1 - luma2;
  vec3 diff = a - b;
  return dot(diff, diff * lumaWeights) * 0.75 + lumaDiff * lumaDiff;
}

bool paletteCompareLuma(int i1, int i2) {
  return lumaPalette[i1] < lumaPalette[i2];
}

vec3[PALETTE_SIZE] deviseMixingPlan(vec3 inputColor) {
  vec3 result[PALETTE_SIZE];
  int proportion_total = 0;
  vec3 so_far = vec3(0.);

  while(proportion_total < PALETTE_SIZE) {
    int chosen_amount = 1;
    int chosen_index = 0;

    int max_text_count = max(1, proportion_total);
    float least_penalty = -1.;
    for(int i = 0; i < PALETTE_SIZE; i++) {
      vec3 color = fetchColor(i);
      vec3 sum = so_far;
      vec3 add = color;
      for(int p = 1; p <= max_text_count; p *= 2) {
        sum += add;
        add += add;
        int t = proportion_total + p;
        vec3 test = sum / float(t);
        float penalty = colorCompare(inputColor, test);
        if(penalty < least_penalty || least_penalty < 0.) {
          least_penalty = penalty;
          chosen_index = i;
          chosen_amount = p;
        }
      }
    }
    vec3 chosen = fetchColor(chosen_index);
    for(int p = 0; p < chosen_amount; p++) {
      if(proportion_total >= PALETTE_SIZE)
        break;
      result[proportion_total++] = chosen;
    }
    so_far += chosen * float(chosen_amount);
  }
  // TODO: Sort by luminance
  return result;
}

// Based on https://bisqwit.iki.fi/story/howto/dither/jy/#YliluomaSOrderedDitheringAlgorithm%202
vec3 ditherYliluoma2(vec3 color) {
  for(int i = 0; i < PALETTE_SIZE; i++) {
    lumaPalette[i] = dot(fetchColor(i), lumaWeights);
  }
  float thresholdMap = indexValue(DITHER_LEVEL);
  thresholdMap *= float(PALETTE_SIZE) / filterSize;
  vec3[PALETTE_SIZE] mixingPlan = deviseMixingPlan(color);
  return mixingPlan[int(thresholdMap)];
}

#endif