import { coin } from "@thi.ng/random"
import * as v from "@thi.ng/vectors"
import { run, SketchFactory } from "drawing/sketch"
import { compileShader, quadBuffer } from "drawing/webgl"
import glsl from "glslify"
import { createBufferInfoFromArrays, drawBufferInfo, setBuffersAndAttributes, setUniforms } from "twgl.js"

const DRAW_BACKGROUND = 0
const DRAW_RAYS = 1
const DRAW_CIRCLE = 2

const vert = glsl`  
  in vec2 position;    
  in vec2 uv;  
  in float color;

  out vec2 v_position;
  out vec2 v_uv;
  out float v_color;
  
  void main() {      
    v_position = position;  
    v_uv = uv;
    v_color = color;    
    gl_Position = vec4(v_position, 0., 1.);
  }
`

const frag = glsl`
  in vec2 v_position;
  in vec2 v_uv;
  in float v_color;

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
      vec2 relative = v_position - gradientCenter; 
      float angle = atan(relative.y, relative.x);
      float t = mod(angle - gradientRotation + PI, 2.0 * PI) / (2.0 * PI);  
      outColor = mix(t);        
    } else if (drawMode == ${DRAW_RAYS}) {
      outColor = vec4(vec3(v_color), 1.);
    } else if (drawMode == ${DRAW_CIRCLE}) {
      if (length(v_uv) < 1.) {
        float t = v_uv.y/2. + 0.5; //TODO: Add rotation
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

  const programInfo = compileShader(gl, { vert, frag })
  const uniforms = {
    colors: [...palette[0], 0, ...palette[1], random.minmax(0.3, 0.7), ...palette[2], 1],
    gradientCenter,
    gradientRotation,
  }
  const drawModes = [DRAW_BACKGROUND, DRAW_RAYS, DRAW_CIRCLE]
  const buffers = [quadBuffer(gl), rays(), circle()]

  return function render() {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(programInfo.program)

    setUniforms(programInfo, uniforms)
    for (const drawMode of drawModes) {
      const buffer = buffers[drawMode]
      setBuffersAndAttributes(gl, programInfo, buffer)
      setUniforms(programInfo, { drawMode })
      drawBufferInfo(gl, buffer)
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
      triangle.forEach((point) => pointData.push(...v.add([], v.rotate([], point, rayRotation), gradientCenter)))

      const color = coin(random) ? random.float(0.2) : 1 - random.float(0.2)
      colorData.push(...Array<number>(3).fill(color))

      rotation += random.minmax(1, 1.5) * rotationStep
    }

    return createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: pointData },
      uv: { numComponents: 2, data: pointData }, //TODO: Hacky, fix
      color: { numComponents: 1, data: colorData },
    })
  }

  function circle() {
    const quadSize = random.minmax(0.1, 0.2)
    const quadVertices = [
      [-1, 1],
      [1, 1],
      [-1, -1],
      [1, -1],
    ]

    const position = quadVertices.flatMap((point) => v.maddN([], point, quadSize, gradientCenter) as [])
    return createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: position },
      uv: { numComponents: 2, data: quadVertices.flat() },
      indices: [0, 1, 2, 2, 1, 3],
    })
  }

  function randomColor() {
    return [random.float(), random.float(), random.float()]
  }
}

run(sketch)
