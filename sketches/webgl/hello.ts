import { run, Sketch } from "drawing/sketch_v2"
import glsl from "glslify"
import {
  createBufferInfoFromArrays,
  createProgramInfo,
  drawBufferInfo,
  m4,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js"

const vert = glsl`#version 300 es

in vec4 position;
in vec3 color;
in mat4 matrix;
uniform vec2 resolution;
 
out vec3 v_color;
void main() {  
  gl_Position = matrix * position;

  v_color = color;
}`

const frag = glsl`#version 300 es

precision highp float;
in vec3 v_color;
out vec4 outColor;
 
void main() {  
  outColor = vec4(v_color, 1.);
}`

const sketch: Sketch = ({ gl, random }) => {
  const instanceCount = 50
  const programInfo = createProgramInfo(gl, [vert, frag])
  const bufferInfo = fillBuffer()
  const uniforms = {
    resolution: [gl.canvas.width, gl.canvas.height],
  }

  return function render() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(programInfo.program)
    setBuffersAndAttributes(gl, programInfo, bufferInfo)
    setUniforms(programInfo, uniforms)
    drawBufferInfo(gl, bufferInfo, gl.TRIANGLES, bufferInfo.numElements, 0, instanceCount)
  }

  function fillBuffer() {
    const matrices = new Float32Array(instanceCount * 16)
    const colors: number[] = []
    for (let i = 0; i < instanceCount; i++) {
      const offsetBytes = i * 16 * 4 // 16 elements, 32 bit each
      const mat = new Float32Array(matrices.buffer, offsetBytes, 16)

      const [scaleX, scaleY] = [random.real(0.2, 0.8), random.real(0.2, 0.8)]
      const [translateX, translateY] = [
        random.real(0.5, 1.2) * (1 - scaleX) * random.sign(),
        random.real(0.5, 1.2) * (1 - scaleY) * random.sign(),
      ]
      m4.scaling([scaleX, scaleY, 1], mat)
      m4.translate(mat, [translateX, translateY, 0], mat)
      colors.push(random.real(0.3, 1), random.real(0.3, 1), random.real(0.3, 1))
    }

    const arrays = {
      position: { numComponents: 2, data: [-1, 1, 1, 1, -1, -1, 1, -1] },
      color: { numComponents: 3, data: colors, divisor: 1 },
      matrix: { numComponents: 16, data: matrices, divisor: 1 },
      indices: [0, 1, 2, 2, 1, 3],
    }
    return createBufferInfoFromArrays(gl, arrays)
  }
}

run(sketch)
