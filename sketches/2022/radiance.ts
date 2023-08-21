import * as v from "@thi.ng/vectors"
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
in float color;

out vec2 v_position;
out float v_color;
void main() {      
  v_position = position;  
  v_color = color;
  gl_Position = vec4(v_position, 0., 1.);
}`

const rayFrag = glsl`#version 300 es
precision highp float;

in float v_color;
out vec4 outColor;
void main() {    
  outColor = vec4(vec3(v_color), 1.);
}`
//TODO: Use one frag shader with preprocessor
const backFrag = glsl`#version 300 es
precision highp float;
#define PI 3.1415926535897932384626433832795

uniform vec4 colors[3];
uniform vec2 gradientCenter;
uniform float gradientRotation;
in vec2 v_position;
out vec4 outColor;

#pragma glslify: oklab_mix = require(../../library/shaders/oklab_mix.glsl) //TODO: basePath

void main() {    
  vec2 relative = v_position - gradientCenter; 
  float angle = atan(relative.y, relative.x);
  float t = mod(angle + gradientRotation + PI, 2.0 * PI) / (2.0 * PI);  

  for (int i = 0; i < colors.length(); i++) {
    if (t > colors[i].w && t < colors[i+1].w) {
      vec3 startColor = colors[i].rgb;
      vec3 endColor = colors[i+1].rgb;
      float t_scaled = (t - colors[i].w)/(colors[i+1].w - colors[i].w);
      outColor = vec4(oklab_mix(startColor, endColor, t_scaled), 1.0);    
      return;
    }
  }  
}`

const sketch: SketchFactory = ({ gl, random }) => {
  const gradientCenter = [random.real(-0.8, 0.8), random.real(-0.8, 0.8)]
  const gradientRotation = Math.atan2(gradientCenter[1], gradientCenter[0]) + random.real(-Math.PI / 4, Math.PI / 4)
  const palette = [randomColor(), randomColor(), randomColor()] //TODO: Generate palette
  const uniforms = {
    colors: [...palette[0], 0, ...palette[1], random.real(0.3, 0.7), ...palette[2], 1],
    gradientCenter,
    gradientRotation,
  }
  const drawBackground = background()
  const drawRays = rays()
  //TODO: Add circle in the centre

  return function render() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    drawBackground()
    drawRays()
  }

  function background() {
    const programInfo = createProgramInfo(gl, [vert, backFrag])
    const bufferInfo = createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: [-1, 1, 1, 1, -1, -1, 1, -1] },
      indices: [0, 1, 2, 2, 1, 3],
    })
    return () => {
      gl.useProgram(programInfo.program)
      setBuffersAndAttributes(gl, programInfo, bufferInfo)
      setUniforms(programInfo, uniforms)
      drawBufferInfo(gl, bufferInfo)
    }
  }

  function rays() {
    const pointData: number[] = []
    const colorData: number[] = []
    const rayHeight = Math.hypot(2, 2)
    const rotationStep = 0.2

    let rotation = -Math.PI
    while (rotation < Math.PI - rotationStep / 2) {
      const rayRotation = rotation - gradientRotation
      const rayAngle = random.real(0.01, 0.03)
      const offset = rayHeight * Math.tan(rayAngle / 2)
      const ray = v.add([], gradientCenter, v.cartesian(null, [rayHeight, rayRotation]))
      const perpendicular = v.cartesian([], [offset, rayRotation + Math.PI / 2])

      const firstPoint = v.add([], ray, perpendicular)
      const secondPoint = v.sub([], ray, perpendicular)
      pointData.push(...gradientCenter, ...firstPoint, ...secondPoint)

      const color = random.bool() ? random.real(0, 0.2) : random.real(0.8, 1)
      colorData.push(...Array<number>(3).fill(color))
      rotation += random.real(1, 1.5) * rotationStep
    }

    const programInfo = createProgramInfo(gl, [vert, rayFrag])
    const bufferInfo = createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: pointData },
      color: { numComponents: 1, data: colorData },
    })
    return () => {
      gl.useProgram(programInfo.program)
      setBuffersAndAttributes(gl, programInfo, bufferInfo)
      drawBufferInfo(gl, bufferInfo)
    }
  }

  function randomColor() {
    return [random.realZeroToOneInclusive(), random.realZeroToOneInclusive(), random.realZeroToOneInclusive()]
  }
}

run(sketch)
