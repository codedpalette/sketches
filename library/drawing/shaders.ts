import { SketchParams } from "core/sketch"
import snoise2 from "glsl-noise/simplex/2d.glsl"
import snoise3 from "glsl-noise/simplex/3d.glsl"
import snoise4 from "glsl-noise/simplex/4d.glsl"
import { Container, Geometry, Mesh, Shader } from "pixi.js"

export interface ShaderQuad {
  mesh: Container
  update: (time: number) => void
}

export const glslNoise2d = snoise2
export const glslNoise3d = snoise3
export const glslNoise4d = snoise4

const preamble = /*glsl*/ `#version 300 es  
precision mediump float;
#define PI 3.1415926535897932384626433832795
${glslNoise3d} //TODO: Add multiple noise functions (resolve duplicates)
`

const quadVert = /*glsl*/ `${preamble}

  uniform mat3 translationMatrix;
  uniform mat3 projectionMatrix;
  uniform vec2 resolution;
  
  in vec2 vertexPosition;
  out vec2 fragCoord; // in pixels
  out vec2 normCoord; // -1 to 1

  void main() {
      gl_Position = vec4((projectionMatrix * translationMatrix * vec3(vertexPosition, 1.0)).xy, 0.0, 1.0);
      normCoord = vertexPosition;
      fragCoord = gl_Position.xy; //TODO: wrong
  }
`

const quadFrag = (mainGlsl: string) => /*glsl*/ `${preamble}

  uniform float time;
  uniform vec2 resolution;

  in vec2 fragCoord; // in pixels
  in vec2 normCoord; // -1 to 1
  out vec4 fragColor;

  void main() {
      ${mainGlsl}
  }
`

export function shaderQuad(params: SketchParams, fragGlsl: string): ShaderQuad {
  const geometry = new Geometry()
    .addAttribute("vertexPosition", [-1, -1, 1, -1, 1, 1, -1, 1])
    .addIndex([0, 1, 2, 0, 2, 3])
  const uniforms = {
    time: 0,
    resolution: [params.width, params.height],
  }
  const shader = Shader.from(quadVert, quadFrag(fragGlsl), uniforms)
  const meshContainer = new Container()
  meshContainer.addChild(new Mesh(geometry, shader)).scale.set(params.width / 2, params.height / 2)
  return {
    mesh: meshContainer,
    update: (time) => {
      shader.uniforms.time = time
    },
  }
}
