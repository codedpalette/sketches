import glslNoise2d from "../glsl/noise2D.glsl"
import glslNoise3d from "../glsl/noise3D.glsl"
import glslNoise4d from "../glsl/noise4D.glsl"

export { glslNoise2d, glslNoise3d, glslNoise4d }

export type ShaderProgram = {
  preamble?: string // Code that goes outside of main function (attribute and uniform definitions, function dependencies)
  main?: string // Code that extends main function, can override local variables and varyings
}

const globalPreamble = /*glsl*/ `#version 300 es  
  precision highp float;
  #define PI 3.1415926535897932384626433832795
`

/**
 * Template for vertex shader program. Defines attributes and uniforms necessary for Pixi.js interop
 * and sets the `gl_Position` variable
 * @param program {@link ShaderProgram} to extend this template
 * @returns {string} vertex glsl code
 */
export const vertexTemplate = (program: ShaderProgram = {}): string => /*glsl*/ `${globalPreamble}
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

/**
 * Template for fragment shader program. Defines varyings passed from {@link vertexTemplate}
 * and sets the `fragColor` variable
 * @param program {@link ShaderProgram} to extend this template
 * @returns {string} fragment glsl code
 */
export const fragTemplate = (program: ShaderProgram = {}): string => /*glsl*/ `${globalPreamble}
  in vec2 vPosition;
  out vec4 fragColor;
  ${program.preamble ?? ""}

  void main() {
    fragColor = vec4(1.0);
    ${program.main ?? ""}
  }
`

/**
 * Template for vertex shader program to be used with Pixi.js Filters.
 * Defines attributes and uniforms necessary for Pixi.js interop
 * and sets the `gl_Position` variable
 * @param program {@link ShaderProgram} to extend this template
 * @returns {string} vertex glsl code
 */
export const filterVertTemplate = (program: ShaderProgram = {}): string => /*glsl*/ `${globalPreamble}
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

/**
 * Template for fragment shader program to be used with Pixi.js Filters.
 * Defines varyings passed from {@link filterVertTemplate}
 * and sets the `fragColor` variable
 * @param program {@link ShaderProgram} to extend this template
 * @returns {string} fragment glsl code
 */
export const filterFragTemplate = (program: ShaderProgram = {}): string => /*glsl*/ `${globalPreamble}
  in vec2 vTextureCoord;
  uniform sampler2D uSampler;
  out vec4 fragColor;
  ${program.preamble ?? ""}

  void main() {
    fragColor = texture(uSampler, vTextureCoord);
    ${program.main ?? ""}
  }
`
