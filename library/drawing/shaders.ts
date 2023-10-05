import { SketchParams } from "core/sketch"
import { Geometry, Mesh, Shader } from "pixi.js"

export interface ShaderQuad {
  mesh: Mesh<Shader>
  update: (time: number) => void
}

// TODO: Add noise functions as preamble with vite-plugin-glsl and glsl-noise
const preamble = /*glsl*/ `#define PI 3.1415926535897932384626433832795`

const shadertoyVert = /*glsl*/ `#version 300 es
  precision mediump float;
  ${preamble}

  uniform mat3 translationMatrix;
  uniform mat3 projectionMatrix;
  uniform vec2 resolution;
  
  in vec2 vertexPosition;
  out vec2 fragCoord; // in pixels
  out vec2 normCoord; // -1 to 1

  void main() {
      gl_Position = vec4((projectionMatrix * translationMatrix * vec3(vertexPosition, 1.0)).xy, 0.0, 1.0);
      normCoord = vertexPosition;
      fragCoord = gl_Position.xy;
  }
`

const shadertoyFrag = (mainGlsl: string) => /*glsl*/ `#version 300 es
  precision mediump float;
  ${preamble}

  uniform float time;
  uniform vec2 resolution;

  in vec2 fragCoord; // in pixels
  in vec2 normCoord; // -1 to 1
  out vec4 fragColor;

  void main() {
      ${mainGlsl}
  }
`

export function shadertoy(params: SketchParams, fragGlsl: string): ShaderQuad {
  const geometry = new Geometry()
    .addAttribute("vertexPosition", [-1, -1, 1, -1, 1, 1, -1, 1])
    .addIndex([0, 1, 2, 0, 2, 3])
  const uniforms = {
    time: 0,
    resolution: [params.width, params.height],
  }
  const shader = Shader.from(shadertoyVert, shadertoyFrag(fragGlsl), uniforms)
  const mesh = new Mesh(geometry, shader)
  mesh.scale.set(params.width, params.height) //TODO: How to scale the mesh?
  return {
    mesh,
    update: (time) => {
      shader.uniforms.time = time
    },
  }
}
