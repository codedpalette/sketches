in vec2 vPosition;
uniform vec2 uThreshold;
uniform vec2 uDirection;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform int uFrame;
uniform bool uInvert;

// TODO: Other comparisons functions
// rgb, hsl, luminance 
float gscale(in vec3 color) {
  return (color.r + color.g + color.b) / 3.;
}

// Based on https://web.archive.org/web/20240809120029/https://ciphrd.com/2020/04/08/pixel-sorting-on-shader-using-well-crafted-sorting-filters-glsl/
vec3 sort(vec3 color) {
  vec2 size = uOutputFrame.zw;
  vec2 pixelCoord = vPosition * size;
  int coord = int(dot(pixelCoord, uDirection));
  int factor = ((coord % 2) * 2 - 1) * ((uFrame % 2) * 2 - 1);
  vec2 direction = (uDirection / uInputSize.xy) * float(factor);
  vec2 neighborOffset = vTextureCoord + direction;

  // loop on x (maybe unnecessary if texture is repeating)
  if(neighborOffset.x < 0.)
    neighborOffset.x = 1. - neighborOffset.x;
  if(neighborOffset.x > 1.)
    neighborOffset.x = fract(neighborOffset.x);

  vec3 actv = color;
  vec3 comp = texture(uTexture, neighborOffset).rgb;  

  // if we are next to a border on the Y-axis, prevent the sort from happening
  if(neighborOffset.y < 0. || neighborOffset.y > 1.) {
    return actv;
  }

  vec3 outColor = actv;
  float gAct = gscale(actv);
  float gComp = gscale(comp);

  float classed = sign(direction.x * 2. + direction.y);

  if(gComp < uThreshold.x || gComp > uThreshold.y || gAct < uThreshold.x || gAct > uThreshold.y) {
    return outColor;
  }

  if(classed < 0.) {
    if(uInvert) {
      if(gAct > gComp) {
        outColor = comp;
      }
    } else {
      if(gAct < gComp) {
        outColor = comp;
      }
    }
  } else {
    if(uInvert) {
      if(gAct < gComp) {
        outColor = comp;
      }
    } else {
      if(gAct > gComp) {
        outColor = comp;
      }
    }
  }

  return outColor;

}