import { coin } from "@thi.ng/random"
import { add, rotate } from "@thi.ng/vectors"
import { run, SketchFactory } from "drawing/sketch"
import { compileShader, quadBuffer, vertex2d } from "drawing/webgl"
import glsl from "glslify"
import {
  createBufferInfoFromArrays,
  createVertexArrayInfo,
  drawBufferInfo,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js"

const DRAW_BACKGROUND = 0
const DRAW_RAYS = 1
const DRAW_CIRCLE = 2

const frag = glsl`
  in vec3 v_localPosition;
  in vec3 v_globalPosition;
  in vec3 v_color;  

  out vec4 outColor;  

  uniform vec4 colors[3];
  uniform vec2 gradientCenter;
  uniform float gradientRotation;
  uniform int drawMode;

  #pragma glslify: oklab_mix = require(./oklab_mix.glsl)

  vec4 mix(float t) {
    for (int i = 0; i < colors.length(); i++) {
      if (t > colors[i].w && t < colors[i+1].w) {
        vec3 startColor = colors[i].rgb;
        vec3 endColor = colors[i+1].rgb;
        float t_scaled = (t - colors[i].w)/(colors[i+1].w - colors[i].w);
        return vec4(oklab_mix(startColor, endColor, t_scaled), 1.0);              
      }
    }
  }

  void main() {    
    if (drawMode == ${DRAW_BACKGROUND}) {
      vec2 relative = v_globalPosition.xy - gradientCenter; 
      float angle = atan(relative.y, relative.x);
      float t = mod(angle - gradientRotation + PI, 2.0 * PI) / (2.0 * PI);  
      outColor = mix(t);        
    } else if (drawMode == ${DRAW_RAYS}) {
      outColor = vec4(vec3(v_color), 1.);
    } else if (drawMode == ${DRAW_CIRCLE}) {
      if (length(v_localPosition) < 1.) {
        float t = v_localPosition.y/2. + 0.5; //TODO: Add rotation
        outColor = mix(t);
      } else {
        discard;
      }
    }    
  }
`

const sketch: SketchFactory = ({ gl, random }) => {
  const gradientCenter = [random.norm(0.8), random.norm(0.8)]
  const gradientRotation = Math.atan2(gradientCenter[1], gradientCenter[0]) + random.norm(Math.PI / 4)
  const palette = [randomColor(), randomColor(), randomColor()] //TODO: Generate palette

  const programInfo = compileShader(gl, { vert: vertex2d, frag })
  const uniforms = {
    colors: [...palette[0], 0, ...palette[1], random.minmax(0.3, 0.7), ...palette[2], 1],
    gradientCenter,
    gradientRotation,
  }
  const drawModes = [DRAW_BACKGROUND, DRAW_RAYS, DRAW_CIRCLE]
  const vertexArrays = [quadBuffer(gl), rays(), circle()].map(
    (buffer) => createVertexArrayInfo(gl, programInfo, buffer) // Using vertex array to not pollute global buffer state
  )

  return function render() {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(programInfo.program)

    setUniforms(programInfo, uniforms)
    for (const drawMode of drawModes) {
      const vao = vertexArrays[drawMode]
      setBuffersAndAttributes(gl, programInfo, vao)
      setUniforms(programInfo, { drawMode })
      drawBufferInfo(gl, vao)
    }
  }

  function rays() {
    const pointData: number[] = []
    const colorData: number[] = []
    const triangleHeight = Math.hypot(2, 2)
    const rotationStep = 0.2

    let rotation = 0
    while (rotation < 2 * Math.PI - rotationStep) {
      const rayRotation = rotation + gradientRotation
      const rayAngle = random.minmax(0.01, 0.05)
      const triangleHalfBase = triangleHeight * Math.tan(rayAngle / 2)

      const triangle = [
        [0, 0],
        [-triangleHeight, triangleHalfBase],
        [-triangleHeight, -triangleHalfBase],
      ]
      triangle.forEach((point) => pointData.push(...add([], rotate([], point, rayRotation), gradientCenter)))

      const color = coin(random) ? random.float(0.2) : 1 - random.float(0.2)
      colorData.push(...Array<number>(9).fill(color))

      rotation += random.minmax(1, 1.5) * rotationStep
    }

    return createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: pointData },
      color: { numComponents: 3, data: colorData },
    })
  }

  function circle() {
    const quadSize = random.minmax(0.1, 0.2)

    // prettier-ignore
    const transformMatrix = [
      quadSize, 0, 0,
      0, quadSize, 0,
      ...gradientCenter, 1
    ] //TODO: Find normal matrix library
    return quadBuffer(gl, { transform: { numComponents: 9, data: transformMatrix, divisor: 1 } })
  }

  function randomColor() {
    return [random.float(), random.float(), random.float()]
  }
}

run(sketch)
