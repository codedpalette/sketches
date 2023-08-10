import { run, Sketch } from "drawing/sketch_v2"
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
in vec3 color;
uniform vec2 resolution;
 
out vec3 v_color;
void main() {
  vec2 zeroToOne = position / resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0; 
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

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
  const programInfo = createProgramInfo(gl, [vert, frag])
  const bufferInfo = fillBuffer()

  return { render }

  function render() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    const uniforms = {
      resolution: [gl.canvas.width, gl.canvas.height],
    }

    gl.useProgram(programInfo.program)
    setBuffersAndAttributes(gl, programInfo, bufferInfo)
    setUniforms(programInfo, uniforms)
    drawBufferInfo(gl, bufferInfo)
  }

  function fillBuffer() {
    const arrays = {
      position: { numComponents: 2, data: [] as number[] },
      color: { numComponents: 3, data: [] as number[] },
      indices: [] as number[],
    }

    for (let i = 0; i < 50; i++) {
      const { positions, indices } = rectangle(
        random.integer(0, gl.canvas.width / 2),
        random.integer(0, gl.canvas.height / 2),
        random.integer(0, gl.canvas.width / 2),
        random.integer(0, gl.canvas.height / 2)
      )
      arrays.position.data.push(...positions)
      arrays.indices.push(...indices.map((idx) => idx + 4 * i))

      const color = [random.realZeroToOneInclusive(), random.realZeroToOneInclusive(), random.realZeroToOneInclusive()]
      arrays.color.data.push(...[...color, ...color, ...color, ...color])
    }

    return createBufferInfoFromArrays(gl, arrays)
  }

  function rectangle(x: number, y: number, w: number, h: number) {
    const x1 = x
    const x2 = x + w
    const y1 = y
    const y2 = y + h

    // prettier-ignore
    const positions = [
      x1, y1,
      x2, y1,
      x1, y2,      
      x2, y2
    ]
    // prettier-ignore
    const indices = [
      0, 1, 2,
      2, 1, 3
    ]

    return { positions, indices }
  }
}

run(sketch)
