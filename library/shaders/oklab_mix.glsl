vec3 srgb2linear(vec3 col) {
  vec3 linear = vec3(0.0);
  for(int i = 0; i < 3; i ++ ) {
    float x = col[i];
    linear[i] = x >= 0.04045 ? pow((x + 0.055) / 1.055, 2.4) : x / 12.92;
  }
  return linear;
}

vec3 linear2srgb(vec3 col) {
  vec3 srgb = vec3(0.0);
  for(int i = 0; i < 3; i ++ ) {
    float x = col[i];
    srgb[i] = x >= 0.0031308 ? 1.055 * pow(x, 1.0 / 2.4) - 0.055 : x * 12.92;
  }
  return srgb;
}

vec3 oklab_mix(vec3 colA, vec3 colB, float h)
{
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
  
  vec3 lmsA = pow(kCONEtoLMS * srgb2linear(colA), vec3(1.0 / 3.0));
  vec3 lmsB = pow(kCONEtoLMS * srgb2linear(colB), vec3(1.0 / 3.0));
  vec3 lms = mix(lmsA, lmsB, h);
  // gain in the middle (no oklab anymore, but looks better?)
  lms *= 1.0 + 0.5 * h * (1.0 - h);
  return linear2srgb(kLMStoCONE * (lms * lms * lms));
}

#pragma glslify:export(oklab_mix)