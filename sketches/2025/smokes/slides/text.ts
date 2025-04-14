import { Assets, ColorMatrixFilter, Container, LoadFontData, Sprite, Text, WebGLRenderer } from "pixi.js"
import { Slide } from "sketches/2025/smokes/presentation"
import { drawShadertoyMesh, ShaderToyShader } from "sketches/2025/smokes/utils/shadertoy"

import url from "../fonts/RubikBubbles-Regular.ttf"

const font = await Assets.load<LoadFontData>(url)

// FIXME: Detect max font size
export function TextSlide(text: string, fontSize: number, renderer: WebGLRenderer): Slide {
  let shader: ShaderToyShader

  return {
    setup() {
      const textObject = new Text({
        text,
        style: { fontFamily: font.family, fontSize, align: "center", wordWrap: true, fill: "red" },
      })
      const textBounds = textObject.getBounds()
      const target = renderer.generateTexture({ target: textObject })
      const sprite = new Sprite(target)
      sprite.anchor.set(0.5)
      sprite.scale.set(1, -1)

      const mesh = drawShadertoyMesh({ x: textBounds.width, y: textBounds.height })
      shader = mesh.shader!
      mesh.mask = sprite

      const container = new Container()
      container.addChild(mesh.mask, mesh)
      const brightness = new ColorMatrixFilter()
      brightness.brightness(0.8, false)
      container.filters = [brightness]
      return container
    },
    update(totalTime) {
      shader.resources.shaderToyUniforms.uniforms.iTime = totalTime
    },
  }
}
