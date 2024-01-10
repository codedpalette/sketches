import * as TWEEN from "@tweenjs/tween.js"
import { isHTMLCanvas, SketchEnv } from "lib"
import { noise3d, Random } from "library/core/random"
import { globalPreamble } from "library/drawing/shaders"
import { clamp } from "library/utils"
import { Color, ColorSource, Container } from "pixi.js"
import {
  Arrays,
  createBufferInfoFromArrays,
  createProgramInfo,
  drawBufferInfo,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setDefaults,
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
    //#define AA 1.

    struct Metaball {
      float radius;
      vec2 position;
      vec3 color;
    };

    in vec2 position;    
    uniform float time;
    uniform vec2 resolution;
    uniform Metaball balls[N];
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
      vec4 color = vec4(0.);    
#ifdef AA 
      // Antialiasing via supersampling
      float uvFactor = 1. / max(resolution.x, resolution.y);    
      for(float i = -AA; i < AA; ++i){
          for(float j = -AA; j < AA; ++j){
            color += renderMetaballs(position + vec2(i, j) * (uvFactor / AA)) / (4.* AA * AA);
          }
      }
#else       
      color = renderMetaballs(position);
#endif /* AA */
      fragColor = color;        
    }
  `

export function screensaver(gl: WebGL2RenderingContext, random: Random, clearColor: ColorSource) {
  const noise = noise3d(random)
  const numBalls = 100

  // Init WebGL state
  setDefaults({ attribPrefix: "a_" })
  const programInfo = createProgramInfo(gl, [vertShader, fragShader(numBalls)])
  const arrays: Arrays = { position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1] } }
  const bufferInfo = createBufferInfoFromArrays(gl, arrays)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // Init metaballs
  const balls: Metaball[] = []
  const tweenGroup = new TWEEN.Group()
  // Since SketchRunner restarts internal sketch clock, we need to explicitly track time for starting tweens properly
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

  const background = new Color(clearColor).toArray()
  const update = (time: number) => {
    isHTMLCanvas(gl.canvas) && resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(background[0], background[1], background[2], 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    currentTweenTime = time * 1000
    tweenGroup.update(currentTweenTime)
    updatePositions(time * 0.1)

    const uniforms = { time, balls, resolution: [gl.canvas.width, gl.canvas.height] }
    gl.useProgram(programInfo.program)
    setBuffersAndAttributes(gl, programInfo, bufferInfo)
    setUniforms(programInfo, uniforms)
    drawBufferInfo(gl, bufferInfo)
  }

  return update
}

// TODO: Proper abstraction over framework in SketchRenderer
export default (clearColor: ColorSource) =>
  ({ renderer, random }: SketchEnv) => {
    const update = screensaver(renderer.gl, random, clearColor)
    const container = new Container()
    container.visible = false
    return { container, update }
  }
