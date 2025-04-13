import p5 from "p5"

import url from "./RussoOne-Regular.ttf"

export interface Slide {
  setup: (p: p5) => void
  draw: (p: p5) => void
  next?: (p: p5) => void
  cleanup?: (p: p5) => void
}

export default (p: p5) => {
  let font: p5.Font
  let shader: p5.Shader
  //const slides: Slide[] = []

  p.preload = () => {
    font = p.loadFont(url)
  }

  let backgroundFramebuffer: p5.Framebuffer
  let textFramebuffer: p5.Framebuffer

  const text = "Как компьютеры\nрисуют"

  p.setup = () => {
    p.createCanvas(1250, 1250, p.WEBGL)
    p.background(255)
    p.textFont(font)
    p.textSize(p.width / 10)
    p.textAlign(p.CENTER, p.CENTER)
    //p.textWrap(p.WORD)
    p.noLoop()

    shader = p.createShader(vertexGlsl, fragmentGlsl)
    backgroundFramebuffer = p.createFramebuffer()
    textFramebuffer = p.createFramebuffer()
    drawText()
    drawBackground()
  }

  function drawText() {
    textFramebuffer.begin()
    p.fill(0)
    p.text(text, -p.width / 2, -p.height / 2, p.width, p.height)
    textFramebuffer.end()
  }

  function drawBackground() {
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
    p.shader(shader)

    shader.setUniform("iResolution", [p.width, p.height])
    shader.setUniform("iTime", p.millis() / 1000)
    p.noStroke()
    const rect = font.textBounds(text, 0, 0) as { x: number; y: number; w: number; h: number }
    //p.rect(rect.x, rect.y, rect.w, rect.h)

    p.resetShader()
    const img = backgroundFramebuffer.get()
    img.mask(textFramebuffer.get())
    //p.image(textFramebuffer, -p.width / 2, -p.height / 2)
    p.image(img, -p.width / 2, -p.height / 2)

    const points = font.textToPoints(text, 0, 0) as { x: number; y: number }[]
    for (const point of points) {
      p.fill(255, 0, 0)
      p.ellipse(point.x, point.y, 5, 5)
    }
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
  precision mediump float;

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
