import * as TWEEN from "@tweenjs/tween.js"
import { SketchEnv } from "lib"
import { noise3d, Random } from "library/core/random"
import { globalPreamble } from "library/drawing/shaders"
import { clamp } from "library/utils"
import { Container } from "pixi.js"
import {
  Arrays,
  createBufferInfoFromArrays,
  createProgramInfo,
  drawBufferInfo,
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
  out vec2 uv;

  void main() {
    uv = a_position;
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

    in vec2 uv;    
    uniform float time;
    uniform Metaball balls[N];
    out vec4 fragColor;        

    void main() {      
      vec4 color = vec4(0.);      
      for(int i = 0; i < N; i++) {
        Metaball ball = balls[i];                
        float influence = ball.radius / length(uv - ball.position);
        influence *= influence; // Square the influence for smoother cutoff
        color.rgb += ball.color * influence;
        color.a += influence;        
      }
      float alpha = max(1. - smoothstep(1., 1.2, color.a), .2); // Creating smooth metaball outline
      if (color.a > .95) {
        float adjustBrightness = 2.;
        color = vec4(normalize(color.rgb) * adjustBrightness, 1.);
      }            
      fragColor = color * alpha;
    }
  `

export function screensaver(gl: WebGL2RenderingContext, random: Random, clearColor: [number, number, number]) {
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
  for (let i = 0; i < numBalls; i++) {
    const radius = random.real(0.03, 0.05)
    const ball: Metaball = {
      radius: 0,
      color: random.color(),
      position: [random.minmax(1), random.minmax(1)],
      speed: random.real(0.001, 0.01),
    }
    balls.push(ball)

    // TODO: Restart tween after finish
    const durationIn = random.real(2000, 5000)
    //const durationOut = random.real(2000, 5000)
    //const timeToLive = random.real(5000, 15000)
    const tweenIn = new TWEEN.Tween(ball).to({ radius }, durationIn).easing(TWEEN.Easing.Elastic.Out)
    // const tweenOut = new TWEEN.Tween(ball)
    //   .to({ radius: 0 }, durationOut)
    //   .easing(TWEEN.Easing.Elastic.In)
    //   .delay(timeToLive)
    tweenIn
      //.chain(tweenOut)
      .start(0)
  }

  function updatePositions(time: number) {
    for (let i = 0; i < numBalls; i++) {
      const ball = balls[i]
      const n1 = noise(ball.position[0], ball.position[1], time + i * 1000)
      const n2 = noise(ball.position[0], ball.position[1], time + i * 1000 + 10000)
      const offsetX = n1 * ball.speed
      const offsetY = n2 * ball.speed
      // TODO: Pass clamping values in a constructor
      ball.position[0] = clamp(ball.position[0] + offsetX, -1, 1)
      ball.position[1] = clamp(ball.position[1] + offsetY, -1, 1)
    }
  }

  const update = (time: number) => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(clearColor[0] / 255, clearColor[1] / 255, clearColor[2] / 255, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    TWEEN.update(time * 1000)
    updatePositions(time * 0.1)

    const uniforms = { time, balls }
    gl.useProgram(programInfo.program)
    setBuffersAndAttributes(gl, programInfo, bufferInfo)
    setUniforms(programInfo, uniforms)
    drawBufferInfo(gl, bufferInfo)
  }

  return update
}

// TODO: Proper abstraction over framework in SketchRenderer
export default (clearColor: [number, number, number]) =>
  ({ renderer, random }: SketchEnv) => {
    const update = screensaver(renderer.gl, random, clearColor)
    const container = new Container()
    container.visible = false
    return { container, update }
  }
