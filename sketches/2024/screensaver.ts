import * as TWEEN from "@tweenjs/tween.js"
import { SketchEnv } from "lib"
import { Random } from "library/core/random"
import { globalPreamble } from "library/drawing/shaders"
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
}

export function screensaver(gl: WebGL2RenderingContext, random: Random) {
  const numBalls = 100

  const vertShader = /*glsl*/ `${globalPreamble}
    in vec2 a_position;
    out vec2 position;

    void main() {
      position = a_position;
      gl_Position = vec4(a_position, 0., 1.);
    }
  `

  const fragShader = /*glsl*/ `${globalPreamble}
    #define N ${numBalls}

    struct Metaball {
      float radius;
      vec2 position;
      vec3 color;
    };

    in vec2 position;
    uniform vec2 resolution;
    uniform float time;
    uniform Metaball balls[N];
    out vec4 fragColor;

    vec4 BallSDF(Metaball ball, vec2 uv) {
      float sdf = ball.radius / length(uv - ball.position);
      return vec4(ball.color * sdf, sdf);
    }

    void mainImage(out vec4 fragColor, in vec2 uv) {          
      vec4 total = vec4(0.);
      for(int i = 0; i < N; i++) {
        Metaball ball = balls[i];        
        float sdf = length(uv - ball.position) - ball.radius;
        if (sdf < 0.) {
          total.rgb += ball.color;
        } else if (sdf < 0.25) {
          total.rgb += ball.color * (ball.radius / (sdf + ball.radius));
        }
        //vec4 sdf = BallSDF(balls[i], uv);
        //float threshold = step(0.75, sdf.a);
        //total += sdf;// * threshold;
      }
      //float totalSdf = total.a;
      //float threshold = step(float(N)*2., totalSdf);      
      //vec3 col = total.rgb/totalSdf * threshold;
      //vec3 col = total.rgb / total.a;
      vec3 col = total.rgb;
      fragColor = vec4(col, 1.0);
    }

    void main() {
      mainImage(fragColor, position);
    }
  `
  setDefaults({ attribPrefix: "a_" })
  const programInfo = createProgramInfo(gl, [vertShader, fragShader])
  const arrays: Arrays = { position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1] } }
  const bufferInfo = createBufferInfoFromArrays(gl, arrays)
  //const balls: Metaball[] = []

  const balls = [
    {
      radius: 0.25,
      color: [1, 0, 0],
      position: [0.5, 0],
    },
    {
      radius: 0.25,
      color: [0, 0, 1],
      position: [-0.5, 0],
    },
  ]
  // for (let i = 0; i < numBalls; i++) {
  //   const ball: Metaball = {
  //     radius: 0.8, //random.real(0.1, 0.2),
  //     color: random.bool() ? [1, 0, 0] : [0, 0, 1], //random.color(),
  //     position: [random.minmax(1), random.minmax(1)],
  //   }
  //   balls.push(ball)
  //   // new TWEEN.Tween({ x: ball.position[0], y: ball.position[1] })
  //   //   .to({ x: 0, y: 0 }, 1000)
  //   //   .easing(TWEEN.Easing.Cubic.InOut)
  //   //   .repeat(Infinity)
  //   //   .yoyo(true)
  //   //   .onUpdate(({ x, y }) => {
  //   //     ball.position[0] = x
  //   //     ball.position[1] = y
  //   //   })
  //   //   .start()
  // }

  const update = (time: number) => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    TWEEN.update(time * 1000)
    const uniforms = {
      resolution: [gl.canvas.width, gl.canvas.height],
      time: time,
      balls,
    }

    gl.useProgram(programInfo.program)
    setBuffersAndAttributes(gl, programInfo, bufferInfo)
    setUniforms(programInfo, uniforms)
    drawBufferInfo(gl, bufferInfo)
  }

  return update
}

// TODO: Proper abstraction over framework in SketchRenderer
export default ({ renderer, random }: SketchEnv) => {
  const update = screensaver(renderer.gl, random)
  const container = new Container()
  container.visible = false
  return { container, update }
}
