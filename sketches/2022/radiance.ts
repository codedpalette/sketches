import { run, SketchFactory } from "drawing/renderer"
import glsl from "glslify"
import {
  createBufferInfoFromArrays,
  createProgramInfo,
  drawBufferInfo,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js"

const vert = glsl`#version 300 es

in vec2 position;
out vec2 v_position;
void main() {      
  v_position = position;
  gl_Position = vec4(v_position, 0., 1.);
}`

const frag = glsl`#version 300 es
precision highp float;

in vec2 v_position;
out vec4 outColor;
uniform vec3 startColor;
uniform vec3 endColor;

#define PI 3.1415926535897932384626433832795

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

void main() {  
  vec2 relative = v_position; 
  float angle = atan(relative.y, relative.x); //TODO: Position and rotate
  float t = (angle + PI) / (2.0 * PI);
  
  outColor = vec4(oklab_mix(startColor, endColor, t), 1.0);  
}`

const sketch: SketchFactory = ({ gl, random }) => {
  const programInfo = createProgramInfo(gl, [vert, frag])
  const bufferInfo = createBufferInfoFromArrays(gl, {
    position: { numComponents: 2, data: [-1, 1, 1, 1, -1, -1, 1, -1] },
    indices: [0, 1, 2, 2, 1, 3],
  }) //TODO: Add triangles for rays and circle in the centre

  const uniforms = {
    startColor: [random.real(0, 1), random.real(0, 1), random.real(0, 1)],
    endColor: [random.real(0, 1), random.real(0, 1), random.real(0, 1)],
  }

  return function render() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(programInfo.program)
    setBuffersAndAttributes(gl, programInfo, bufferInfo)
    setUniforms(programInfo, uniforms)
    drawBufferInfo(gl, bufferInfo)
  }
}

run(sketch)

// run((params) => {
//   const [w, h] = [params.width, params.height]
//   const centerX = random.real(w * 0.1, w * 0.9)
//   const centerY = random.real(h * 0.1, h * 0.9)
//   let angle: number
//   if (centerX < w / 2 && centerY < h / 2) {
//     angle = random.real(0.1, 0.4)
//   } else if (centerX > w / 2 && centerY < h / 2) {
//     angle = random.real(0.6, 0.9)
//   } else if (centerX > w / 2 && centerY > h / 2) {
//     angle = random.real(1.1, 1.4)
//   } else {
//     angle = random.real(1.6, 1.9)
//   }
//   angle *= pi

//   const container = new Container()
//   container.addChild(createGradientFill())
//   container.addChild(createRays())
//   return { container }

//   function createGradientFill() {
//     return renderCanvas((ctx) => {
//       const gradient = ctx.createConicGradient(angle, centerX, centerY)
//       const palette = [randomColor(), randomColor(), randomColor()]
//       gradient.addColorStop(0, palette[0].toRgbaString())
//       gradient.addColorStop(random.real(0.3, 0.7), palette[1].toRgbaString())
//       gradient.addColorStop(1, palette[2].toRgbaString())
//       ctx.fillStyle = gradient
//       ctx.fillRect(0, 0, w, h)
//     }, params)
//   }

//   function createRays() {
//     const rayContainer = new Container()
//     rayContainer.position.set(centerX - w / 2, -centerY + h / 2)
//     rayContainer.rotation = -angle

//     const lineLength = hypot(w, h)
//     let rotation = 0
//     while (rotation < 2 * pi) {
//       const graphics = new Graphics().lineStyle({
//         width: 1,
//         color: gray(random.bool() ? 20 : 240),
//         alpha: random.real(64, 255) / 255,
//         cap: LINE_CAP.SQUARE,
//       })
//       graphics.rotation = rotation

//       const lineWidth = random.real(1, 20)
//       for (let i = -lineWidth; i <= lineWidth; i++) {
//         graphics.moveTo(0, 0).lineTo(lineLength, i)
//       }

//       rayContainer.addChild(graphics)
//       rotation += random.real(0.1, 0.3)
//     }

//     return rayContainer
//   }

//   function randomColor() {
//     return new Color([
//       random.realZeroToOneInclusive(),
//       random.realZeroToOneInclusive(),
//       random.realZeroToOneInclusive(),
//       random.real(64, 255) / 255,
//     ])
//   }
// })
