import { Segment } from "@flatten-js/core"
import { fragTemplate, vertexTemplate } from "drawing/shaders"
import { Attribute, Buffer, Color, ColorSource, Geometry, Mesh, Shader, TYPES } from "pixi.js"

// https://wwwtyro.net/2019/11/18/instanced-lines.html
export function renderLines(segments: Segment[], width: number, color: ColorSource) {
  // prettier-ignore
  const segmentInstanceGeometry = [
    0, -0.5,
    1, -0.5,
    1, 0.5,
    0, -0.5,
    1, 0.5,
    0, 0.5,
  ]
  const positionBuffer = Buffer.from(segmentInstanceGeometry)
  const pointsBuffer = Buffer.from(segments.flatMap((seg) => [seg.start.x, seg.start.y, seg.end.x, seg.end.y]))

  const positionAttribute = new Attribute(0, 2, false, TYPES.FLOAT, 0, 0, true, 0)
  const elementSize = Float32Array.BYTES_PER_ELEMENT
  const segmentStartAttribute = new Attribute(1, 2, false, TYPES.FLOAT, elementSize * 4, elementSize * 0, true, 1)
  const segmentEndAttribute = new Attribute(1, 2, false, TYPES.FLOAT, elementSize * 4, elementSize * 2, true, 1)

  const geometry = new Geometry([positionBuffer, pointsBuffer], {
    aPosition: positionAttribute,
    aSegmentStart: segmentStartAttribute,
    aSegmentEnd: segmentEndAttribute,
  })
  geometry.instanced = true
  geometry.instanceCount = segments.length

  const vertexShader = vertexTemplate({
    preamble: /*glsl*/ `
      in vec2 aSegmentStart, aSegmentEnd;
      uniform float width;
    `,
    main: /*glsl*/ `
      vec2 xBasis = aSegmentEnd - aSegmentStart;
      vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
      vec2 point = aSegmentStart + xBasis * aPosition.x + yBasis * width * aPosition.y;
      gl_Position.xy = point;
    `,
  })
  const fragShader = fragTemplate({
    preamble: /*glsl*/ `
      uniform vec4 color;
    `,
    main: /*glsl*/ `
      fragColor = color;
    `,
  })
  const shader = Shader.from(vertexShader, fragShader, { width, color: new Color(color) })
  return new Mesh(geometry, shader)
}
