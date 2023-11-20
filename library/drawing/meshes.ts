import { Segment } from "@flatten-js/core"
import { fragTemplate, ShaderProgram, vertexTemplate } from "drawing/shaders"
import { Attribute, Buffer, Color, ColorSource, Geometry, Mesh, Shader, TYPES } from "pixi.js"

/**
 * Render multiple line segments in a single draw call using instanced geometry.
 * For more information see https://wwwtyro.net/2019/11/18/instanced-lines.html
 * @param segments Line segments to render
 * @param width Uniform line width
 * @param color Uniform fill color
 * @param [fragShaderExt] Optional fragment {@link ShaderProgram} to customize rendering
 * @returns {Mesh}
 */
export function renderLines(
  segments: Segment[],
  width: number,
  color: ColorSource,
  fragShaderExt: ShaderProgram = {}
): Mesh<Shader> {
  // Initialize a quad for instance geometry
  // prettier-ignore
  const segmentInstanceGeometry = [
    0, -0.5,
    1, -0.5,
    1, 0.5,
    0, -0.5,
    1, 0.5,
    0, 0.5,
  ]
  const positionBufferIdx = 0
  const positionBuffer = Buffer.from(segmentInstanceGeometry)
  const pointsBufferIdx = 1
  const pointsBuffer = Buffer.from(segments.flatMap((seg) => [seg.start.x, seg.start.y, seg.end.x, seg.end.y]))

  // Define vertex attributes
  const positionAttribute = new Attribute(positionBufferIdx, 2, false, TYPES.FLOAT, 0, 0, true, 0)
  const elementSize = Float32Array.BYTES_PER_ELEMENT
  // Use single interleaved buffer for segment start and segment end attributes
  const segmentStartAttribute = new Attribute(
    pointsBufferIdx,
    2,
    false,
    TYPES.FLOAT,
    elementSize * 4,
    elementSize * 0,
    true,
    1
  )
  const segmentEndAttribute = new Attribute(
    pointsBufferIdx,
    2,
    false,
    TYPES.FLOAT,
    elementSize * 4,
    elementSize * 2,
    true,
    1
  )

  const geometry = new Geometry([positionBuffer, pointsBuffer], {
    aPosition: positionAttribute, // position of the instance geometry vertex
    aSegmentStart: segmentStartAttribute, // position of the first vertex of a line segment
    aSegmentEnd: segmentEndAttribute, // position of the second vertex of a line segment
  })
  geometry.instanced = true
  geometry.instanceCount = segments.length

  // Define shader program
  const vertexShader = vertexTemplate({
    preamble: /*glsl*/ `
      in vec2 aSegmentStart, aSegmentEnd;
      out float instanceId;
      uniform float width;
    `,
    main: /*glsl*/ `
      // Vector from segment start to segment end
      vec2 xBasis = aSegmentEnd - aSegmentStart;
      // Calculate normalized perpendicular direction
      vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
      // The x-component of aPosition is along the length of our line segment.
      // Since aPosition.x is either 0 or 1, then the first brackets will evaluate to either
      // aSegmentStart or aSegmentEnd. We then offset it by width in the yBasis direction
      // to get the appropriate point in space for that vertex
      vec2 point = (aSegmentStart + xBasis * aPosition.x) + (yBasis * width * aPosition.y);
      position = point;
      // Pass instance id to the fragment shader so that it can be used to provide more variety
      // in rendering segments (for example it can be used as a noise sampling offset)
      instanceId = float(gl_InstanceID);
    `,
  })
  const fragShader = fragTemplate({
    preamble: /*glsl*/ `
      in float instanceId;
      uniform vec4 color;
      ${fragShaderExt.preamble ?? ""}
    `,
    main: /*glsl*/ `
      fragColor = color;
      ${fragShaderExt.main ?? ""}
    `,
  })
  const uniforms = { width, color: new Color(color) }
  const shader = Shader.from(vertexShader, fragShader, uniforms)
  return new Mesh(geometry, shader)
}
