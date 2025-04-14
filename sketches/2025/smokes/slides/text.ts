import { Assets, Container, LoadFontData, Text } from "pixi.js"
import { Slide } from "sketches/2025/smokes/presentation"
import { drawShadertoyMesh, ShaderToyShader } from "sketches/2025/smokes/utils/shadertoy"

import url from "../RussoOne-Regular.ttf"

const font = await Assets.load<LoadFontData>(url)

export function TextSlide(text: string, fontSize: number): Slide {
  let shader: ShaderToyShader

  return {
    setup() {
      const container = new Container()
      const textObject = new Text({
        text,
        style: { fontFamily: font.family, fontSize, align: "center", wordWrap: true },
      })
      textObject.anchor.set(0.5)
      textObject.scale.set(1, -1)

      const textBounds = textObject.getBounds()
      const mesh = drawShadertoyMesh({ x: textBounds.width, y: textBounds.height })
      shader = mesh.shader!
      mesh.position.set(0, 0)
      container.addChild(mesh)
      container.addChild(textObject)
      // FIXME: Mask
      return container
    },
    update(totalTime) {
      shader.resources.shaderToyUniforms.uniforms.iTime = totalTime
    },
  }
}
