import { run, SketchFactory } from "drawing/webgl"
import glsl from "glslify"
import {
  createBufferInfoFromArrays,
  createProgramInfo,
  drawBufferInfo,
  m4,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js"
import { map } from "utils/map"

const vert = glsl`#version 300 es

in vec2 position;
in vec3 color;
in mat4 matrix;
in float startDepth;
uniform vec2 resolution;
uniform float depthOffset;
uniform float scaleVectorRotation;
 
out vec3 v_color;
out vec2 v_position;
out vec2 w_position;
void main() {    
  vec2 worldCentre = (matrix * vec4(0, 0, 1, 1)).xy;  
  float centreRotation = atan(worldCentre.y, worldCentre.x);  

  float depth = fract(startDepth+depthOffset);  
  float theta = scaleVectorRotation - centreRotation;
  
  vec2 scale = abs(vec2(cos(theta), sin(theta)));  
  scale = scale * scale * scale*0.5+0.5;
  vec4 scaleVector = vec4(scale * scale * scale, 1, 1);  
    
  gl_Position = matrix * (scaleVector * vec4(position, depth, 1));

  v_color = color;
  v_position = position;
  w_position = gl_Position.xy;  
}`

const frag = glsl`#version 300 es

precision highp float;
in vec3 v_color;
in vec2 v_position;
in vec2 w_position;
uniform float scaleVectorRotation;
out vec4 outColor;
 
void main() {  
  vec2 scale = vec2(cos(scaleVectorRotation), sin(scaleVectorRotation));
  float d = length(v_position-scale);  
  float d_world = length(w_position-scale);  
  outColor = vec4((v_color-d/3.), 0.5); //TODO: Fix lighting
}`

const sketch: SketchFactory = ({ gl, random }) => {
  const instanceCount = 10000
  const scaleVectorOffset = random.real(0, Math.PI * 2)
  const scaleVectorRotationSeconds = 4
  const programInfo = createProgramInfo(gl, [vert, frag])
  const bufferInfo = fillBuffer()
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  return function render(_, totalTime) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const uniforms = {
      resolution: [gl.canvas.width, gl.canvas.height],
      depthOffset: Math.floor(totalTime * 5) / instanceCount,
      scaleVectorRotation:
        map(totalTime % scaleVectorRotationSeconds, 0, scaleVectorRotationSeconds, 0, Math.PI * 2) + scaleVectorOffset,
    }

    gl.useProgram(programInfo.program)
    setBuffersAndAttributes(gl, programInfo, bufferInfo)
    setUniforms(programInfo, uniforms)
    drawBufferInfo(gl, bufferInfo, gl.TRIANGLES, bufferInfo.numElements, 0, instanceCount)
  }

  function fillBuffer() {
    const matrices = new Float32Array(instanceCount * 16)
    const colors: number[] = []
    const depth: number[] = []
    for (let i = 0; i < instanceCount; i++) {
      const offsetBytes = i * 16 * 4 // 16 elements, 32 bit each
      const mat = new Float32Array(matrices.buffer, offsetBytes, 16)

      const [scaleX, scaleY] = [random.real(0.2, 0.8), random.real(0.2, 0.8)]
      const [translateX, translateY] = [
        random.real(0.5, 5) * (1 - scaleX) * random.sign(),
        random.real(0.5, 5) * (1 - scaleY) * random.sign(),
      ]
      m4.scaling([scaleX, scaleY, 1], mat)
      m4.translate(mat, [translateX, translateY, 0], mat)
      colors.push(random.real(0.3, 1), random.real(0.3, 1), random.real(0.3, 1))
      depth.push(i / instanceCount)
    }

    const arrays = {
      position: { numComponents: 2, data: [-1, 1, 1, 1, -1, -1, 1, -1] },
      color: { numComponents: 3, data: colors, divisor: 1 },
      matrix: { numComponents: 16, data: matrices, divisor: 1 },
      startDepth: { numComponents: 1, data: depth, divisor: 1 },
      indices: [0, 1, 2, 2, 1, 3],
    }
    return createBufferInfoFromArrays(gl, arrays)
  }
}

run(sketch)
