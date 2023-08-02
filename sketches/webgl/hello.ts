//import glsl from "glslify";

const vert = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
 
// all shaders have a main function
void main() {
 
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}`

const frag = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  // Just set the output to a constant reddish-purple
  outColor = vec4(1, 0.5, 0.5, 1);
}`

const canvas = document.createElement("canvas")
canvas.id = "sketch"
canvas.width = 1080
canvas.height = 1080
document.body.appendChild(canvas)

const gl = canvas.getContext("webgl2") as WebGL2RenderingContext
const vertShader = createShader(gl, gl.VERTEX_SHADER, vert) as WebGLShader
const fragShader = createShader(gl, gl.FRAGMENT_SHADER, frag) as WebGLShader
const program = createProgram(gl, vertShader, fragShader) as WebGLProgram

const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
const positions = [0, 0, 0, 0.5, 0.7, 0]
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
gl.enableVertexAttribArray(positionAttributeLocation)
const size = 2 // 2 components per iteration
const type = gl.FLOAT // the data is 32bit floats
const normalize = false // don't normalize the data
const stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
const offset = 0 // start at the beginning of the buffer
gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

gl.viewport(0, 0, canvas.width, canvas.height)
gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT)
gl.useProgram(program)
gl.bindVertexArray(vao)

const primitiveType = gl.TRIANGLES
const drawOffset = 0
const count = 3
gl.drawArrays(primitiveType, drawOffset, count)

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
