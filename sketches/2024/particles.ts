import { SketchEnv } from "library/core/types"
import { drawBackground } from "library/drawing/helpers"
import { Container, ParticleContainer, Sprite, Texture } from "pixi.js"

export default ({ random, bbox }: SketchEnv) => {
  const container = new Container()
  container.addChild(drawBackground("black", bbox))

  const particleCount = 100000
  const particleContainer = new ParticleContainer(particleCount, { vertices: true, tint: true })
  let x = random.minmax(1),
    y = random.minmax(1)
  //const [a, b, c, d] = Array.from({ length: 4 }).map(() => random.minmax(2))
  const [a, b, c, d] = [2, 2, random.minmax(2), random.minmax(2)] //TODO: Find parameters

  let maxX = x,
    minX = x,
    maxY = y,
    minY = y
  for (let i = 0; i < particleCount; i++) {
    const particle = new Sprite(Texture.WHITE)
    particle.anchor.set(0.5)
    particle.scale.set(0.1)
    particle.position.set((x * bbox.width) / 4, (y * bbox.height) / 4)
    particle.alpha = 0.5
    particleContainer.addChild(particle)
    const newX = Math.sin(a * y) + c * Math.cos(a * x)
    const newY = Math.sin(b * x) + d * Math.cos(b * y)
    x = newX
    y = newY
    maxX = Math.max(x, maxX)
    minX = Math.min(x, minX)
    maxY = Math.max(y, maxY)
    minY = Math.min(y, minY)
  }
  console.log(`x = [${minX}, ${maxX}], y = [${minY}, ${maxY}]`)
  container.addChild(particleContainer)
  return { container }
}
