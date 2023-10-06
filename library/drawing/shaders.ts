import { SketchParams } from "core/sketch"
import { Container, Geometry, Mesh, Shader } from "pixi.js"

export interface ShaderQuad {
  mesh: Container
  update: (time: number) => void
}

// TODO: Add noise functions as preamble with vite-plugin-glsl and glsl-noise
const preamble = /*glsl*/ `#define PI 3.1415926535897932384626433832795`

const quadVert = /*glsl*/ `#version 300 es
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
      fragCoord = gl_Position.xy; //TODO: wrong
  }
`

const quadFrag = (mainGlsl: string) => /*glsl*/ `#version 300 es
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
