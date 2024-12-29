#ifdef REGULAR
#define DITHER_FUNC ditherRegular

float distSquared(vec3 a, vec3 b) {
  vec3 diff = a - b;
  return dot(diff, diff);
}

vec3 ditherRegular(vec3 color) {
  float thresholdMap = indexValue(DITHER_LEVEL) - 0.5;
  vec3 ditheredColor = color + thresholdMap * uSpread;
  vec3 closestColor = fetchColor(0);
  float closestDistance = distSquared(ditheredColor, closestColor);
  for(int i = 1; i < PALETTE_SIZE; i += 1) {
    vec3 attempt = fetchColor(i);
    float dist = distSquared(ditheredColor, attempt);
    bool isLess = dist < closestDistance;
    closestColor = isLess ? attempt : closestColor;
    closestDistance = isLess ? dist : closestDistance;
  }
  return closestColor;
}

#endif