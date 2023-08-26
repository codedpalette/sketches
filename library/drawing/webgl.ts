import glsl from "glslify"
import { Arrays, createBufferInfoFromArrays, createProgramInfo } from "twgl.js"

const prelude = `#version 300 es
precision mediump float;
#define PI 3.1415926535897932384626433832795`

export type ShaderSource = { vert: string; frag: string }

export function compileShader(gl: WebGL2RenderingContext, { vert, frag }: ShaderSource) {
  const vertexSource = `${prelude}\n${vert}`
  const fragmentSource = `${prelude}\n${frag}`
  return createProgramInfo(gl, [vertexSource, fragmentSource])
}

export function quadBuffer(gl: WebGL2RenderingContext, additionalAttributes: Arrays = {}) {
  return createBufferInfoFromArrays(gl, {
    position: { numComponents: 2, data: [-1, 1, 1, 1, -1, -1, 1, -1] },
    indices: [0, 1, 2, 2, 1, 3],
    ...additionalAttributes,
  })
}

export const vertex2d = glsl`
  in vec3 position; // Local, default z = 0  
  in vec3 color; // default (0, 0, 0)
  in mat3 transform;

  out vec3 v_localPosition;
  out vec3 v_globalPosition;
  out vec3 v_color;

  void main() {
    mat3 transformMatrix = transform == mat3(0.0) ? mat3(1.0) : transform; //If uninitialized, set identity matrix
    v_localPosition = position;

    // Calculate global position without depth, than set it back
    float depth = position.z;    
    v_globalPosition = transformMatrix * vec3(position.xy, 1.0);
    v_globalPosition.z = depth;

    v_color = color;
    gl_Position = vec4(v_globalPosition, 1.0);
  }
`
