import glslNoise from "glsl/snoise.glsl"

export { glslNoise }

export type ShaderProgram = {
  preamble?: string
  main?: string
}

const globalPreamble = /*glsl*/ `#version 300 es  
  precision highp float;
  #define PI 3.1415926535897932384626433832795
`

export const vertexTemplate = (program: ShaderProgram = {}) => /*glsl*/ `${globalPreamble}
  in vec2 aPosition;
  uniform mat3 projectionMatrix;
  uniform mat3 translationMatrix;
  out vec2 vPosition;
  ${program.preamble ?? ""}

  void main() {
    vPosition = aPosition;
    vec2 position = aPosition;
    ${program.main ?? ""}
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(position.xy, 1.0)).xy, 0.0, 1.0);        
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

export const filterVertTemplate = (program: ShaderProgram = {}) => /*glsl*/ `${globalPreamble}
  in vec2 aVertexPosition;
  uniform mat3 projectionMatrix;
  uniform vec4 inputSize;
  uniform vec4 outputFrame;
  out vec2 vTextureCoord;
  ${program.preamble ?? ""}

  void main() {
    vTextureCoord = aVertexPosition * (outputFrame.zw * inputSize.zw);
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;
    ${program.main ?? ""}
    gl_Position = vec4((projectionMatrix * vec3(position.xy, 1.0)).xy, 0.0, 1.0);    
  }

`

export const filterFragTemplate = (program: ShaderProgram = {}) => /*glsl*/ `${globalPreamble}
  in vec2 vTextureCoord;
  uniform sampler2D uSampler;
  out vec4 fragColor;
  ${program.preamble ?? ""}

  void main() {
    fragColor = texture(uSampler, vTextureCoord);
    ${program.main ?? ""}
  }
`
