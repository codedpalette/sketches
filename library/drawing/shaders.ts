import glslNoise2d from "../glsl/noise2D.glsl"
import glslNoise3d from "../glsl/noise3D.glsl"
import glslNoise4d from "../glsl/noise4D.glsl"

export { glslNoise2d, glslNoise3d, glslNoise4d }

export type ShaderProgram = {
  /**
   *
   */
  preamble?: string // Code that goes outside of main function (attribute and uniform definitions, function dependencies)
  /**
   *
   */
  main?: string // Code that extends main function, can override local variables and varyings
}

export const globalPreamble = /*glsl*/ `#version 300 es   
  precision highp float;
  #define PI 3.1415926535897932384626433832795
`

/**
 * Template for vertex shader program. Defines attributes and uniforms necessary for Pixi.js interop
 * and sets the `gl_Position` variable
 * @param program {@link ShaderProgram} to extend this template
 * @returns vertex glsl code
 */
export const meshVertTemplate = (program: ShaderProgram = {}): string => /*glsl*/ `${globalPreamble}
  in vec2 aPosition;  
  uniform mat3 uProjectionMatrix;
  uniform mat3 uWorldTransformMatrix;
  uniform mat3 uTransformMatrix;
  out vec2 vPosition;
  ${program.preamble ?? ""}

  void main() {
    vPosition = aPosition;
    vec2 position = aPosition;
    ${program.main ?? ""}
    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(position.xy, 1.0)).xy, 0.0, 1.0);        
  }
`

/**
 * Template for fragment shader program. Defines varyings passed from {@link meshVertTemplate}
 * and sets the `fragColor` variable
 * @param program {@link ShaderProgram} to extend this template
 * @returns fragment glsl code
 */
export const meshFragTemplate = (program: ShaderProgram = {}): string => /*glsl*/ `${globalPreamble}
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
 * @returns vertex glsl code
 */
export const filterVertTemplate = (program: ShaderProgram = {}): string => /*glsl*/ `${globalPreamble}
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform vec4 uOutputTexture;
  ${program.preamble ?? ""}

  vec2 filterVertexPosition() {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;      
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return position;
  }

  vec2 filterTextureCoord(){
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
  }

  void main() {
    vTextureCoord = filterTextureCoord();
    vec2 position = filterVertexPosition();
    ${program.main ?? ""}
    gl_Position = vec4(position, 0.0, 1.0);    
  }

`

/**
 * Template for fragment shader program to be used with Pixi.js Filters.
 * Defines varyings passed from {@link filterVertTemplate}
 * and sets the `fragColor` variable
 * @param program {@link ShaderProgram} to extend this template
 * @returns fragment glsl code
 */
export const filterFragTemplate = (program: ShaderProgram = {}): string => /*glsl*/ `${globalPreamble}
  in vec2 vTextureCoord;
  uniform sampler2D uTexture;
  out vec4 fragColor;
  ${program.preamble ?? ""}

  void main() {
    fragColor = texture(uTexture, vTextureCoord);
    ${program.main ?? ""}
  }
`
