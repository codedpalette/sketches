import { random2 } from "@thi.ng/vectors"
import { run, SketchFactory } from "drawing/sketch"
import { compileShader } from "drawing/webgl"
import glsl from "glslify"
import {
  Arrays,
  AttribInfo,
  createBufferInfoFromArrays,
  drawBufferInfo,
  m4,
  setAttribInfoBufferFromArray,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js"
import { map, sign } from "utils"

const vert = glsl`
  in vec2 position;
  in vec3 color;
  in mat4 matrix; //TODO: use mat3
  in float depth;
  
  out vec3 v_color;
  out vec2 v_position;
  out vec2 w_position;
  out float v_depth;
  
  uniform vec2 resolution;
  uniform float scaleVectorRotation;

  const float SQRT_2 = sqrt(2.);
  void main() {        
    float theta = scaleVectorRotation - (1. - depth)*PI;
    
    vec2 scaleDirection = vec2(cos(theta), sin(theta));       
    vec2 scaleSign = sign(scaleDirection);
    vec4 scaleVector = vec4(pow(abs(scaleDirection), vec2(4., 4.)) * 0.4 + .8, 1, 1);    
    
    vec2 translateDirection = min(abs(scaleDirection) * SQRT_2, vec2(1., 1.)) * scaleSign;
    vec4 translateVector = vec4(translateDirection, 0, 0);      
        
    vec4 local = vec4(position*.5, depth, 1);  
    gl_Position = matrix * ((local + translateVector) * scaleVector - translateVector);  

    v_color = color;
    v_position = position;
    w_position = gl_Position.xy;  
    v_depth = depth;
  }
`

const frag = glsl`
  #pragma glslify: noise = require(glsl-noise/simplex/4d)

  in vec3 v_color;
  in vec2 v_position;
  in vec2 w_position;
  in float v_depth;
  out vec4 outColor;

  uniform float scaleVectorRotation;
  uniform float totalTime;  
  
  const float noiseAmp = 0.2; //TODO: Increase in the direction to light
  const float radius = 0.8;
  
  void main() {  
    vec2 scale = vec2(cos(scaleVectorRotation), sin(scaleVectorRotation));

    float d = length(v_position-scale);  
    float d_world = length(w_position-scale); 
    float r = length(v_position);
    
    vec3 color = (v_color - d_world/2.) * (v_color - d/2.); //TODO: Fix lighting, fresnel
    float alpha = smoothstep(0.5, 1.5, r)+0.7;
    
    if (r > radius + noiseAmp) {
      outColor = vec4(color, 0.);    
    } else if (r < radius) {
      outColor = vec4(color, alpha);    
    } else {
      float theta = atan(v_position.y, v_position.x);
      float n = noise(vec4(v_position*2., totalTime, v_depth * 100.));
      outColor = vec4(color, r > radius + n*noiseAmp ? 0. : alpha);
    }    
  }
`

//TODO: Portrait orientation
const sketch: SketchFactory = ({ gl, random }) => {
  const instanceCount = random.minmaxInt(1000, 3000) //TODO: Optimize for 10000
  const scaleVectorOffset = random.float(Math.PI * 2)
  const scaleVectorRotationSeconds = 3

  const matrices = new Float32Array(instanceCount * 16)
  const colors: number[] = []

  const programInfo = compileShader(gl, { vert, frag })
  const bufferInfo = fillBuffer()
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  let counter = 0
  return function render(_, totalTime) {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const scaleVectorRotation =
      map(totalTime % scaleVectorRotationSeconds, 0, scaleVectorRotationSeconds, 0, Math.PI * 2) + scaleVectorOffset
    const uniforms = { resolution: [gl.canvas.width, gl.canvas.height], scaleVectorRotation, totalTime }
    if (totalTime * 5 - counter > 1) {
      counter++
      updateBuffer()
    }

    gl.useProgram(programInfo.program)
    setBuffersAndAttributes(gl, programInfo, bufferInfo)
    setUniforms(programInfo, uniforms)
    drawBufferInfo(gl, bufferInfo, gl.TRIANGLES, bufferInfo.numElements, 0, instanceCount)
  }

  function updateBuffer() {
    const head = matrices.slice(0, 16)
    const tail = new Float32Array(matrices.buffer, 16 * 4)
    matrices.set(tail)
    matrices.set(head, (instanceCount - 1) * 16)
    setAttribInfoBufferFromArray(gl, bufferInfo.attribs?.matrix as AttribInfo, matrices)

    for (let i = 0; i < 3; i++) {
      colors.push(colors.shift() as number)
    }
    setAttribInfoBufferFromArray(gl, bufferInfo.attribs?.color as AttribInfo, colors)
  }

  function fillBuffer() {
    const depth: number[] = []
    for (let i = 0; i < instanceCount; i++) {
      const offsetBytes = i * 16 * 4 // 16 elements, 32 bit each
      const mat = new Float32Array(matrices.buffer, offsetBytes, 16)

      const [scaleX, scaleY] = random2(null, 0.1, 0.2)
      const [translateX, translateY] = [scaleX, scaleY].map(
        (scale) => ((1 - scale) / scale) * sign(random) * random.float()
      )
      m4.scaling([scaleX, scaleY, 1], mat)
      m4.translate(mat, [translateX, translateY, 0], mat)
      colors.push(random.minmax(0.3, 1), random.minmax(0.3, 1), random.minmax(0.3, 1))
      depth.push(i / instanceCount)
    }

    const arrays: Arrays = {
      position: { numComponents: 2, data: [-1, 1, 1, 1, -1, -1, 1, -1] },
      color: { numComponents: 3, data: colors, divisor: 1 },
      matrix: { numComponents: 16, data: matrices, divisor: 1 },
      depth: { numComponents: 1, data: depth, divisor: 1 },
      indices: [0, 1, 2, 2, 1, 3],
    }
    return createBufferInfoFromArrays(gl, arrays)
  }
}

run(sketch)
