import p5 from "p5"

import url from "./RussoOne-Regular.ttf"

export default (p: p5) => {
  let font: p5.Font
  let shader: p5.Shader
  //const slides: Slide[] = []

  p.preload = () => {
    font = p.loadFont(url)
  }

  let backgroundFramebuffer: p5.Framebuffer
  let textFramebuffer: p5.Framebuffer

  const text = "Как\nкомпьютеры\nрисуют"

  p.setup = () => {
    p.createCanvas(1250, 1250, p.WEBGL)
    p.background(255)
    p.textFont(font)
    p.textSize(p.width / 7)
    p.textAlign(p.CENTER, p.BASELINE)
    //p.noLoop()

    p.push()
    p.translate(-p.width / 2, -p.height / 2)
    shader = p.createShader(vertexGlsl, fragmentGlsl)
    backgroundFramebuffer = p.createFramebuffer()
    textFramebuffer = p.createFramebuffer()
    drawText()
    //drawBackground()
    p.pop()
  }

  function drawText() {
    textFramebuffer.begin()
    //p.background("red")
    p.fill(0)
    p.text(text, -p.width / 2, 0, p.width, p.height)
    textFramebuffer.end()
  }

  function _drawBackground() {
    backgroundFramebuffer.begin()
    p.noStroke()
    p.beginShape(p.QUAD_STRIP)
    p.fill(0, 255, 255)
    p.vertex(-p.width / 2, -p.height / 2)
    p.vertex(p.width / 2, -p.height / 2)
    p.fill(100, 0, 100)
    p.vertex(-p.width / 2, p.height / 2)
    p.vertex(p.width / 2, p.height / 2)
    p.endShape()
    backgroundFramebuffer.end()
  }

  p.draw = () => {
    p.noStroke()

    const rect = font.textBounds(text, 0, 0) as { x: number; y: number; w: number; h: number }
    p.translate(0, -rect.h / 4)

    backgroundFramebuffer.begin()
    shader.setUniform("iResolution", [p.width, p.height])
    shader.setUniform("iTime", p.millis() / 1000)
    p.shader(shader)
    p.rect(rect.x, rect.y, rect.w, rect.h)
    backgroundFramebuffer.end()
    p.resetShader()

    //p.erase()
    //p.image(backgroundFramebuffer, -p.width / 2, -p.height / 2)

    const img = backgroundFramebuffer.get()
    img.mask(textFramebuffer.get())
    //p.image(textFramebuffer, -p.width / 2, -p.height / 2)
    p.image(img, -p.width / 2, -p.height / 2)

    //p.fill(0)
    // p.texture(backgroundFramebuffer)
    // p.fr
    //p.text(text, -p.width / 2, 0, p.width, p.height)
    //p.rect(0, 0, 100, 100)
    p.noErase()
    //p.filter("blur", 1)

    // const points = font.textToPoints(text, 0, 0) as { x: number; y: number }[]
    // for (const point of points) {
    //   p.fill(255, 0, 0)
    //   p.ellipse(point.x, point.y, 5, 5)
    // }
  }
}

const vertexGlsl = /* glsl */ `#version 300 es

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  in vec3 aPosition;
  in vec2 aTexCoord;

  void main() {
    // copy the position data into a vec4, using 1.0 as the w component
    vec4 positionVec4 = vec4(aPosition, 1.0);
    gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
  }
`

const fragmentGlsl = /* glsl */ `#version 300 es
  precision highp float;

  uniform vec2 iResolution;
  uniform float iTime;

  out vec4 fragColor;

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord / iResolution;
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    fragColor = vec4(col,1.0);
  }
`
