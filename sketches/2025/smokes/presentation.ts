import { Application, Container } from "pixi.js"
import { TextSlide } from "sketches/2025/smokes/slides/text"

export interface Slide {
  setup: () => Container
  update: (totalTime: number) => void
  next?: () => boolean
}

const slides: Slide[] = [TextSlide("Как компьютеры рисуют", 180)]

const app = new Application()
await app.init({ width: 1250, height: 1250, antialias: true, background: "white" })
document.body.appendChild(app.canvas)

const currentSlide = slides[0]
const container = currentSlide.setup()
container.position.set(app.screen.width / 2, -app.screen.height / 2)
app.stage.scale.set(1, -1)
app.stage.addChild(container)

let totalTime = 0

app.ticker.add(() => {
  totalTime += app.ticker.elapsedMS / 1000
  currentSlide.update(totalTime)
})
