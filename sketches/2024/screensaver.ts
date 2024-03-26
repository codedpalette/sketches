import * as TWEEN from "@tweenjs/tween.js"
import { noise3d, Random } from "library/core/random"
import { pixi } from "library/core/sketch"
import { globalPreamble } from "library/drawing/shaders"
import fxaa from "library/glsl/fxaa.glsl"
import { clamp } from "library/utils"
import { Color, ColorSource, Container } from "pixi.js"
import {
  Arrays,
  bindFramebufferInfo,
  createBufferInfoFromArrays,
  createFramebufferInfo,
  createProgramInfo,
  createTexture,
  createUniformBlockInfo,
  drawBufferInfo,
  resizeCanvasToDisplaySize,
  resizeFramebufferInfo,
  setBlockUniforms,
  setBuffersAndAttributes,
  setDefaults,
  setUniformBlock,
  setUniforms,
} from "twgl.js"

type Metaball = {
  radius: number
  position: [number, number]
  color: [number, number, number]
  speed: number
}

const vertShader = /*glsl*/ `${globalPreamble}
  in vec2 a_position;
  out vec2 position;

  void main() {
    position = a_position;
    gl_Position = vec4(a_position, 0., 1.);
  }
`

const fragShader = (numBalls: number) => /*glsl*/ `${globalPreamble}    
    #define N ${numBalls}    

    struct Metaball {
      float radius;
      vec2 position;
      vec3 color;
    };

    in vec2 position;    
    uniform float time;
    uniform vec2 resolution;
    uniform Metaballs {
      Metaball balls[N]; 
    };
    out vec4 fragColor;    
    
    vec4 renderMetaballs(vec2 uv) {
      vec4 color = vec4(0.);      
      for(int i = 0; i < N; i++) {
        Metaball ball = balls[i];                  
        float influence = ball.radius / length(uv - ball.position);
        influence *= influence; // Square the influence for smoother cutoff
        color.rgb += ball.color * influence;
        color.a += influence;                
      }      
      if (color.a < 1.) {
        color.rgb *= 2.; // Adjust brightness
      } else {
        color.rgb /= color.a;
      }            
      float alpha = 1. - smoothstep(0.95, 1., color.a);      
      return color * alpha;     
    }

    void main() {                
      fragColor = renderMetaballs(position);
    }
  `

const fxaaShader = /*glsl*/ `${globalPreamble}
    ${fxaa}

    uniform vec2 resolution;
    uniform sampler2D tex;
    out vec4 fragColor;
    
    void main() {
      fragColor = applyFXAA(gl_FragCoord.xy, resolution, tex);
    }
`

function screensaver(gl: WebGL2RenderingContext, random: Random, clearColor: ColorSource) {
  const noise = noise3d(random)
  const background = new Color(clearColor).toArray()
  const numBalls = 100
  const fxaa = true

  // Init WebGL state
  setDefaults({ attribPrefix: "a_" })
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(background[0], background[1], background[2], 1)

  // Init buffers
  const arrays: Arrays = { position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1] } }
  const bufferInfo = createBufferInfoFromArrays(gl, arrays)

  // Init programs
  const metaballsProgramInfo = createProgramInfo(gl, [vertShader, fragShader(numBalls)])
  const fxaaProgramInfo = createProgramInfo(gl, [vertShader, fxaaShader])
  const uniformBlockInfo = createUniformBlockInfo(gl, metaballsProgramInfo, "Metaballs")

  // Init framebuffer
  const tex = createTexture(gl, {
    width: gl.canvas.width,
    height: gl.canvas.height,
    min: gl.LINEAR,
    wrap: gl.CLAMP_TO_EDGE,
  })
  const attachments = [{ attachment: tex }]
  const fbi = createFramebufferInfo(gl, attachments)

  // Init metaballs
  const balls: Metaball[] = []
  const tweenGroup = new TWEEN.Group()
  // Since SketchRunner restarts internal sketch clock, we need to explicitly track time for starting tweens properly
  // TODO: Abstract in SketchRunner
  let currentTweenTime = 0
  for (let i = 0; i < numBalls; i++) {
    const ball = createMetaball()
    createTween(ball)
    balls.push(ball)
  }

  function createMetaball(): Metaball {
    return {
      radius: random.real(0.03, 0.05),
      color: random.color(0.2),
      position: [random.minmax(1), random.minmax(1)],
      speed: random.real(0.001, 0.01),
    }
  }

  function createTween(ball: Metaball) {
    const radius = ball.radius
    ball.radius = 0
    const durationIn = random.real(2, 5) * 1000
    const durationOut = random.real(2, 5) * 1000
    const timeToLive = random.real(10, 20) * 1000
    const tweenIn = new TWEEN.Tween(ball, tweenGroup).to({ radius }, durationIn).easing(TWEEN.Easing.Elastic.Out)
    const tweenOut = new TWEEN.Tween(ball, tweenGroup)
      .to({ radius: 0 }, durationOut)
      .easing(TWEEN.Easing.Elastic.In)
      .delay(timeToLive)
      .onComplete(() => {
        Object.assign(ball, createMetaball())
        createTween(ball)
      })
    tweenIn.chain(tweenOut).start(currentTweenTime)
  }

  function updatePositions(time: number) {
    for (let i = 0; i < numBalls; i++) {
      const ball = balls[i]
      const n1 = noise(ball.position[0], ball.position[1], time + i * 1000)
      const n2 = noise(ball.position[0], ball.position[1], time + i * 1000 + 10000)
      const offsetX = n1 * ball.speed
      const offsetY = n2 * ball.speed
      ball.position[0] = clamp(ball.position[0] + offsetX, -1, 1)
      ball.position[1] = clamp(ball.position[1] + offsetY, -1, 1)
    }
  }

  const update = (time: number) => {
    const resized = "style" in gl.canvas && resizeCanvasToDisplaySize(gl.canvas)
    if (resized) {
      resizeFramebufferInfo(gl, fbi, attachments)
    }
    const resolution = [gl.canvas.width, gl.canvas.height]

    currentTweenTime = time * 1000
    tweenGroup.update(currentTweenTime)
    updatePositions(time * 0.1)

    bindFramebufferInfo(gl, fxaa ? fbi : null)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(metaballsProgramInfo.program)
    setBuffersAndAttributes(gl, metaballsProgramInfo, bufferInfo)
    setBlockUniforms(uniformBlockInfo, { balls })
    setUniformBlock(gl, metaballsProgramInfo, uniformBlockInfo)
    setUniforms(metaballsProgramInfo, { time, resolution })
    drawBufferInfo(gl, bufferInfo)

    if (fxaa) {
      bindFramebufferInfo(gl, null)
      gl.useProgram(fxaaProgramInfo.program)
      setBuffersAndAttributes(gl, fxaaProgramInfo, bufferInfo)
      setUniforms(fxaaProgramInfo, { tex, resolution })
      drawBufferInfo(gl, bufferInfo)
    }
  }

  return update
}

// HACK: Until proper abstraction over framework in SketchRenderer is implemented
export default (clearColor: ColorSource) =>
  pixi(({ renderer, random }) => {
    const update = screensaver(renderer.gl, random, clearColor)
    const container = new Container()
    container.visible = false
    return { container, update }
  })
