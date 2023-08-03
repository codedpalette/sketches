import glsl from "glslify"
import { random } from "utils/random"

const vert = glsl`#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

uniform vec2 u_resolution;
 
// all shaders have a main function
void main() {
  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;
 
  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;
 
  // convert from 0->2 to -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;
 
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}`

const frag = glsl`#version 300 es
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
 
// we need to declare an output for the fragment shader
out vec4 outColor;

uniform vec4 u_color;
 
void main() {  
  outColor = u_color;
}`

const canvas = document.createElement("canvas")
canvas.id = "sketch"
canvas.width = 1080
canvas.height = 1080
document.body.appendChild(canvas)
canvas.onclick = main
main()

function main() {
  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext
  const vertShader = createShader(gl, gl.VERTEX_SHADER, vert) as WebGLShader
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, frag) as WebGLShader
  const program = createProgram(gl, vertShader, fragShader) as WebGLProgram

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
  const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution")
  const colorLocation = gl.getUniformLocation(program, "u_color")

  const positionBuffer = gl.createBuffer()
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  gl.enableVertexAttribArray(positionAttributeLocation)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  const size = 2 // 2 components per iteration
  const type = gl.FLOAT // the data is 32bit floats
  const normalize = false // don't normalize the data
  const stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
  const offset = 0 // start at the beginning of the buffer
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.useProgram(program)
  gl.bindVertexArray(vao)
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)

  for (let i = 0; i < 50; i++) {
    // Put a rectangle in the position buffer
    setRectangle(
      gl,
      random.integer(0, gl.canvas.width / 2),
      random.integer(0, gl.canvas.height / 2),
      random.integer(0, gl.canvas.width / 2),
      random.integer(0, gl.canvas.height / 2)
    )

    // Set a random color.
    gl.uniform4f(
      colorLocation,
      random.realZeroToOneInclusive(),
      random.realZeroToOneInclusive(),
      random.realZeroToOneInclusive(),
      1
    )

    // Draw the rectangle.
    const primitiveType = gl.TRIANGLES
    const offset = 0
    const count = 6
    gl.drawArrays(primitiveType, offset, count)
  }
}

function setRectangle(gl: WebGL2RenderingContext, x: number, y: number, w: number, h: number) {
  const x1 = x
  const x2 = x + w
  const y1 = y
  const y2 = y + h

  // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
  // whatever buffer is bound to the `ARRAY_BUFFER` bind point
  // but so far we only have one buffer. If we had more than one
  // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

  // prettier-ignore
  const positions = [
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2]
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type) as WebGLShader
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean
  if (success) {
    return shader
  }

  console.log(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram() as WebGLProgram
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  const success = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean
  if (success) {
    return program
  }

  console.log(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}
