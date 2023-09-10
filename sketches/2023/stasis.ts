import { glsl } from "@use-gpu/shader/glsl"
import { run, SketchFactory } from "drawing/sketch"
import { createModel, quad, renderModels } from "drawing/webgl"
import { AttribInfo, m4, setAttribInfoBufferFromArray } from "twgl.js"
import { map } from "utils/helpers"

const vert = glsl`
  #pragma global
  in vec2 position;
  #pragma global
  in vec3 color;
  #pragma global
  in mat4 matrix; //TODO: use mat3
  #pragma global
  in float depth;

  #pragma global
  out vec3 v_color;
  #pragma global
  out vec2 v_position;
  #pragma global
  out vec2 w_position;
  #pragma global
  out float v_depth;

  #pragma global
  uniform vec2 resolution;
  #pragma global
  uniform float scaleVectorRotation;

  const float SQRT_2 = sqrt(2.);
  #pragma export
  vec3 main() {
    float theta = scaleVectorRotation - (1. - depth)*PI;

    // TODO: Maybe precalculate matrices and store in texture?
    vec2 scaleDirection = vec2(cos(theta), sin(theta));
    vec2 scaleSign = sign(scaleDirection);
    vec4 scaleVector = vec4(pow(abs(scaleDirection), vec2(4., 4.)) * 0.4 + .8, 1, 1);

    vec2 translateDirection = min(abs(scaleDirection) * SQRT_2, vec2(1., 1.)) * scaleSign;
    vec4 translateVector = vec4(translateDirection, 0, 0);

    vec4 local = vec4(position*.5, depth, 1);
    vec4 transformed = matrix * ((local + translateVector) * scaleVector - translateVector);

    v_color = color;
    v_position = position;
    w_position = transformed.xy;
    v_depth = depth;

    return transformed.xyz;
  }
`

const frag = glsl`  
  #pragma global
  in vec3 v_color;
  #pragma global
  in vec2 v_position;
  #pragma global
  in vec2 w_position;
  #pragma global
  in float v_depth;  

  #pragma global
  uniform float scaleVectorRotation;
  #pragma global
  uniform float totalTime;

  const float noiseAmp = 0.2; //TODO: Increase in the direction to light
  const float radius = 0.8;

  #pragma export
  vec4 main() {
    vec2 scale = vec2(cos(scaleVectorRotation), sin(scaleVectorRotation));

    float d = length(v_position-scale);
    float d_world = length(w_position-scale);
    float r = length(v_position);

    vec3 color = (v_color - d_world/2.) * (v_color - d/2.); //TODO: Fix lighting, fresnel
    float alpha = smoothstep(0.5, 1.5, r)+0.7;

    if (r > radius + noiseAmp) {
      return vec4(color, 0.);
    } else if (r < radius) {
      return vec4(color, alpha);
    } else {
      float theta = atan(v_position.y, v_position.x);
      float n = 0.;//noise(vec4(v_position*2., totalTime, v_depth * 100.)); //TODO: Add noise function
      return vec4(color, r > radius + n*noiseAmp ? 0. : alpha);
    }
  }
`

//TODO: Portrait orientation
const sketch: SketchFactory = ({ gl, random }) => {
  const instanceCount = random.integer(1000, 3000) //TODO: Optimize for 10000
  const scaleVectorOffset = random.realZeroTo(Math.PI * 2)
  const scaleVectorRotationSeconds = 3
  const matrices = new Float32Array(instanceCount * 16)
  const colors: number[] = []
  const model = createModel(gl, {
    geometry: fillBuffer(),
    material: { vert, frag },
    instanceCount,
  })

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  let counter = 0
  return function render(totalTime) {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const periodicTime = totalTime % scaleVectorRotationSeconds
    const scaleVectorRotation = map(periodicTime, 0, scaleVectorRotationSeconds, 0, Math.PI * 2) + scaleVectorOffset
    const uniforms = { resolution: [gl.canvas.width, gl.canvas.height], scaleVectorRotation, totalTime }
    if (totalTime * 5 - counter > 1) {
      counter++
      updateBuffer()
    }

    model.uniforms = uniforms
    renderModels(gl, model)
    // gl.useProgram(programInfo.program)
    // setBuffersAndAttributes(gl, programInfo, bufferInfo)
    // setUniforms(programInfo, uniforms)
    // drawBufferInfo(gl, bufferInfo, gl.TRIANGLES, bufferInfo.numElements, 0, instanceCount)
  }

  function updateBuffer() {
    const head = matrices.slice(0, 16)
    const tail = new Float32Array(matrices.buffer, 16 * 4)
    matrices.set(tail)
    matrices.set(head, (instanceCount - 1) * 16)
    setAttribInfoBufferFromArray(gl, model.bufferInfo.attribs?.matrix as AttribInfo, matrices)

    for (let i = 0; i < 3; i++) {
      colors.push(colors.shift() as number)
    }
    setAttribInfoBufferFromArray(gl, model.bufferInfo.attribs?.color as AttribInfo, colors)
  }

  function fillBuffer() {
    const depth: number[] = []
    for (let i = 0; i < instanceCount; i++) {
      const offsetBytes = i * 16 * 4 // 16 elements, 32 bit each
      const mat = new Float32Array(matrices.buffer, offsetBytes, 16)

      const [scaleX, scaleY] = random.vec2(0.1, 0.2) // TODO: Calculate based on instance count
      const [translateX, translateY] = [scaleX, scaleY].map(
        (scale) => ((1 - scale) / scale) * random.sign() * random.realZeroToOneExclusive()
      )
      m4.scaling([scaleX, scaleY, 1], mat)
      m4.translate(mat, [translateX, translateY, 0], mat)
      colors.push(random.real(0.3, 1), random.real(0.3, 1), random.real(0.3, 1))
      depth.push(i / instanceCount)
    }

    return {
      ...quad,
      color: { size: 3, data: colors, divisor: 1 },
      matrix: { size: 16, data: matrices, divisor: 1 },
      depth: { size: 1, data: depth, divisor: 1 },
    }
  }
}

run(sketch)
