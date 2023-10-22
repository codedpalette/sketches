export type ShaderProgram = {
  preamble?: string
  main?: string
}

const globalPreamble = /*glsl*/ `#version 300 es  
precision highp float;
#define PI 3.1415926535897932384626433832795`

//TODO: Noise functions preambles (resolve duplicates)

export const vertexTemplate = (program: ShaderProgram = {}) => /*glsl*/ `${globalPreamble}
  in vec2 aPosition;
  uniform mat3 projectionMatrix;
  uniform mat3 translationMatrix;
  out vec2 vPosition;
  ${program.preamble ?? ""}

  void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0., 1.);
    ${program.main ?? ""}
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(gl_Position.xy, 1.0)).xy, 0.0, 1.0);        
  }
`

export const fragTemplate = (program: ShaderProgram = {}) => /*glsl*/ `${globalPreamble}
  in vec2 vPosition;
  out vec4 fragColor;
  ${program.preamble ?? ""}

  void main() {
    fragColor = vec4(1.0);
    ${program.main ?? ""}
  }
`
