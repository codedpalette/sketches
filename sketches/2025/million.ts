import { webgl } from "library/core/sketch"
import { globalPreamble } from "library/drawing/shaders"
import {
  Arrays,
  createBufferInfoFromArrays,
  createProgramInfo,
  drawBufferInfo,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js"

export default webgl(({ gl, random }) => {
  gl.clearColor(0, 0, 0, 1)

  // Init buffers
  const arrays: Arrays = {
    position: { numComponents: 2, data: [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5] },
  }
  const bufferInfo = createBufferInfoFromArrays(gl, arrays)
  const programInfo = createProgramInfo(gl, [vert, frag])
  let color = random.color()

  return {
    render() {
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(programInfo.program)
      setBuffersAndAttributes(gl, programInfo, bufferInfo)
      setUniforms(programInfo, { color })
      drawBufferInfo(gl, bufferInfo)
    },
    next() {
      color = random.color()
    },
  }
})

const vert = /*glsl*/ `${globalPreamble}
  in vec2 a_position;
  out vec2 v_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_position = a_position;
  }
`

const frag = /*glsl*/ `${globalPreamble}
  in vec2 v_position;
  uniform vec3 color;
  out vec4 fragColor;

  void main() {
    fragColor = vec4(color, 1.0);
  }
`
