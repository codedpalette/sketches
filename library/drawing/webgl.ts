import { createProgramInfo } from "twgl.js"

const prelude = `#version 300 es
precision mediump float;
#define PI 3.1415926535897932384626433832795`

export type ShaderSource = { vert: string; frag: string }

export function compileShader(gl: WebGL2RenderingContext, { vert, frag }: ShaderSource) {
  const vertexSource = `${prelude}\n${vert}`
  const fragmentSource = `${prelude}\n${frag}`
  return createProgramInfo(gl, [vertexSource, fragmentSource])
}
