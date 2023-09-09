import { bindBundle, glsl } from "@use-gpu/shader/glsl"
import { run, SketchFactory } from "drawing/sketch"
import { createModel, quad, renderModels } from "drawing/webgl"
import { oklabGradient } from "shaders/colors"
import { attribute } from "shaders/inputs"
import { transform2d } from "shaders/transform"
import { Matrix3, Vector2 } from "threejs-math"

const backgroundFrag = glsl`
  const int paletteSize = 3;
  #pragma global
  in vec3 v_position;
  #pragma global
  uniform vec2 gradientCenter;
  #pragma global
  uniform float gradientRotation;
  #pragma global
  uniform vec4 palette[paletteSize];

  vec3 conic(vec2 position, vec2 gradientCenter, float gradientRotation, vec4 palette[paletteSize]);

  #pragma export
  vec3 main() {    
    return conic(v_position.xy, gradientCenter, gradientRotation, palette);
  }
`

const raysVert = glsl`
  #pragma global
  in vec3 position;
  #pragma global
  in vec3 color;
  #pragma global
  out vec3 v_color;  

  #pragma export
  vec3 main() {
    v_color = color;
    return position;
  }
`

const circleFrag = glsl`
  #pragma global
  in vec3 v_localPosition;  
  #pragma global
  uniform vec4 palette[3];

  vec3 linear(float t, vec4 palette[3]);

  #pragma export
  vec3 main() {
    if (length(v_localPosition) < 1.) {
      float t = v_localPosition.y/2. + 0.5; //TODO: Add rotation
      return linear(t, palette);
    } else {
      discard;
    }
  }
`

const sketch: SketchFactory = ({ gl, random }) => {
  const gradientCenter = new Vector2(random.minmax(0.8), random.minmax(0.8))
  const gradientRotation = Math.atan2(gradientCenter.y, gradientCenter.x) + random.minmax(Math.PI / 4)
  const palette = [...random.color(), 0, ...random.color(), random.real(0.3, 0.7), ...random.color(), 1] //TODO: Generate palette
  const uniforms = { palette, gradientCenter, gradientRotation }
  const models = [initBackground(), initRays(), initCircle()] //TODO: Add noise texture

  return function render() {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    renderModels(gl, ...models)
    //TODO: Add antialias
  }

  function initBackground() {
    return createModel(gl, {
      geometry: quad,
      material: {
        vert: attribute("position", "vec3"),
        frag: bindBundle(backgroundFrag, oklabGradient(3)),
      },
      uniforms,
    })
  }

  function initRays() {
    const pointData: number[] = []
    const colorData: number[] = []
    const triangleHeight = Math.hypot(2, 2)
    const rotationStep = 0.2

    let rotation = 0
    while (rotation < 2 * Math.PI - rotationStep) {
      const rayRotation = rotation + gradientRotation
      const rayAngle = random.real(0.01, 0.05)
      const triangleHalfBase = triangleHeight * Math.tan(rayAngle / 2)
      const triangle = [
        new Vector2(0, 0),
        new Vector2(-triangleHeight, triangleHalfBase),
        new Vector2(-triangleHeight, -triangleHalfBase),
      ]

      const transformMatrix = new Matrix3().makeRotation(rayRotation).translate(gradientCenter.x, gradientCenter.y)
      triangle.forEach((point) => pointData.push(...point.applyMatrix3(transformMatrix).toArray()))

      const color = random.bool() ? random.realZeroTo(0.2) : 1 - random.realZeroTo(0.2)
      colorData.push(...Array<number>(9).fill(color))
      rotation += random.real(1, 1.5) * rotationStep
    }

    return createModel(gl, {
      geometry: {
        position: { size: 2, data: pointData },
        color: { size: 3, data: colorData },
      },
      material: {
        vert: raysVert,
        frag: attribute("color", "vec3"),
      },
    })
  }

  function initCircle() {
    const quadSize = random.real(0.1, 0.2)
    const transformMatrix = new Matrix3()
      .makeScale(quadSize, quadSize)
      .translate(gradientCenter.x, gradientCenter.y)
      .toArray()

    return createModel(gl, {
      geometry: { ...quad, transform: { size: 9, data: transformMatrix, divisor: 1 } },
      material: {
        vert: transform2d,
        frag: bindBundle(circleFrag, oklabGradient(3)),
      },
      uniforms,
    })
  }
}

run(sketch)
