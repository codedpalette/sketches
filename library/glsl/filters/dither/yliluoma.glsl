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

vec3 test_loop(vec3 color) {
  float ratioDenominator = filterSize;
  vec3 sum;
  for(int i = 0; i < PALETTE_SIZE; i++) {
    vec3 c1 = vec3(1., 0., 0.);//fetchColor(i);
    for(int j = i; j < PALETTE_SIZE; j++) {
      vec3 c2 = vec3(0., 0., 1.);//fetchColor(j);
      float mixComponentsDiff = colorCompare(c1, c2);
      for(float ratioNominator = 0.; ratioNominator <= ratioDenominator; ratioNominator++) {
        if(i == j && ratioNominator == 0.)
          break;
        float ratio = ratioNominator / ratioDenominator;
        vec3 mixed = mix(c1, c2, ratio);
        //float penalty = evaluateMixingError(color, mixed, c1, c2, ratioNominator / ratioDenominator);
        // Evaluate mixing error
        //float mixDiff = 0.;
        //float mixDiff = colorCompare(color, mixed);
        vec3 a = color;
        vec3 b = mixed;
        float luma1 = dot(a, lumaWeights);
        float luma2 = dot(b, lumaWeights);
        float lumaDiff = luma1 - luma2;
        vec3 diff = a - b;
        vec3 diffSquared = diff;//pow(diff, vec3(2.));
        //vec3 diffWeightedVec = diff * lumaWeights;
        //float diffWeighted = dot(diff, diff * lumaWeights);
        float mixDiff = lumaDiff;//diffSquared.r;
        //float mixDiff = diffWeightedVec.r;//dot(diff, diff * lumaWeights) * 0.75 + lumaDiff * lumaDiff;        
        float offset = abs(ratio - 0.5) + 0.5;
        float penalty = mixComponentsDiff * 0.1 * offset + mixDiff;
        sum += vec3(penalty);//abs(c1 - c2);
      }
    }
  }
  return sum / (float(PALETTE_SIZE * PALETTE_SIZE) * ratioDenominator);
}

void deviseMixingPlan(in vec3 inputColor, out vec3 color1, out vec3 color2, out float ratio) {
  vec3 outColor1 = vec3(0., 0., 0.);
  vec3 outColor2 = vec3(0., 0., 0.);
  float outRatio = 0.;
  float leastPenalty = 1e99;
  for(int i = 0; i < PALETTE_SIZE; i++) {
    vec3 c1 = vec3(1., 0., 0.);//fetchColor(i);
    for(int j = i; j < PALETTE_SIZE; j++) {
      vec3 c2 = vec3(0., 0., 1.);//fetchColor(j);
      for(float ratioNominator = 0.; ratioNominator <= filterSize; ratioNominator++) {
        if(i == j && ratioNominator == 0.)
          break;
        vec3 mixed = mix(c1, c2, ratioNominator / filterSize);
        float penalty = evaluateMixingError(inputColor, mixed, c1, c2, ratioNominator / filterSize);
        if(penalty < leastPenalty) {
          leastPenalty = penalty;
          outColor1 = c1;
          outColor2 = c2;
          outRatio = ratioNominator / filterSize;
        }
      }
    }
  }
  color1 = outColor1;
  color2 = outColor2;
  ratio = outRatio;
}

// void deviseMixingPlan(in vec3 inputColor, out vec3 color1, out vec3 color2, out float ratio) {
//   vec3 outColor1 = vec3(0., 0., 0.);
//   vec3 outColor2 = vec3(0., 0., 0.);
//   float outRatio = 0.;
//   float leastPenalty = 1e99;
//   float ratioDenominator = filterSize;
//   for(int i = 0; i < PALETTE_SIZE; i++) {
//     vec3 c1 = fetchColor(i);
//     for(int j = i; j < PALETTE_SIZE; j++) {
//       vec3 c2 = fetchColor(j);
//       // float ratioNominator = ratioDenominator * 0.5;
//       // if(c1 != c2) {
//       //   // Determine the ratio of mixing for each channel.
//       //   //   solve c1 + ratioNominator*(c2-c1)/ratioDenominator = inputColor for ratioNominator
//       //   // Take a weighed average of these three ratios according to the
//       //   // perceived luminosity of each channel (according to CCIR 601).
//       //   vec3 solution = ratioDenominator * (inputColor - c1) / (c2 - c1);
//       //   vec3 nonEquality = vec3(notEqual(c1, c2));
//       //   ratioNominator = dot(lumaWeights * solution, nonEquality) / dot(lumaWeights, nonEquality);
//       //   ratioNominator = round(clamp(ratioNominator, 0., ratioDenominator));
//       // }
//       // // Determine what mixing them in this proportion will produce
//       // vec3 mixed = mix(c1, c2, ratioNominator / ratioDenominator);
//       // float penalty = evaluateMixingError(inputColor, mixed, c1, c2, ratioNominator / ratioDenominator);
//       // if(penalty < leastPenalty) {
//       //   leastPenalty = penalty;
//       //   color1 = c1;
//       //   color2 = c2;
//       //   ratio = ratioNominator / ratioDenominator;
//       // }
//     //   float loopEnd = float(i != j) * ratioDenominator; // if (i == j ** ratioNominator != 0) break
//     //   for(float ratioNominator = 0.; ratioNominator <= loopEnd; ratioNominator++) {
//     //     vec3 mixed = mix(c1, c2, ratioNominator / ratioDenominator);
//     //     float penalty = evaluateMixingError(inputColor, mixed, c1, c2, ratioNominator / ratioDenominator);
//     //     float isLess = float(penalty < leastPenalty);
//     //     leastPenalty = mix(leastPenalty, penalty, isLess);
//     //     outColor1 = mix(outColor1, c1, isLess);
//     //     outColor2 = mix(outColor2, c2, isLess);
//     //     outRatio = mix(outRatio, ratioNominator / ratioDenominator, isLess);
//     //     if(penalty < leastPenalty) {
//     //       leastPenalty = penalty;
//     //       outColor1 = c1;
//     //       outColor2 = c2;
//     //       outRatio = ratioNominator / ratioDenominator;
//     //     }
//     //   }
//     // }
//   }
//   color1 = outColor1;
//   color2 = outColor2;
//   ratio = outRatio;
// }

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