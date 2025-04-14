import { Geometry, Mesh, PointData, Shader } from "pixi.js"

export type ShaderToyShader = Shader & {
  resources: { shaderToyUniforms: { uniforms: { iResolution: [number, number]; iTime: number } } }
}

export function drawShadertoyMesh(size: PointData) {
  const geometry = new Geometry({
    attributes: {
      aPosition: [-1, -1, 1, -1, 1, 1, -1, 1],
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  })

  const shader = Shader.from({
    gl: {
      vertex,
      fragment,
    },
    resources: {
      shaderToyUniforms: {
        iResolution: { value: [size.x, size.y], type: "vec2<f32>" },
        iTime: { value: 0, type: "f32" },
      },
    },
  }) as ShaderToyShader

  const quad = new Mesh<Geometry, ShaderToyShader>({ geometry, shader })
  quad.width = size.x
  quad.height = size.y
  return quad
}

const vertex = /*glsl*/ `#version 300 es

in vec2 aPosition;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
}`

const fragment = /*glsl*/ `#version 300 es
uniform vec2 iResolution;
uniform float iTime;

out vec4 fragColor;

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord / iResolution;
  vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
  fragColor = vec4(col,1.0);
}
`
