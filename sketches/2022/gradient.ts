import { Sketch } from "drawing/sketch_v2"

//TODO: change color space

const sketch: Sketch = ({ gl, random, params }) => {
  const render = () => {}
  return { render }
}

// run((params) => {
//   const [w, h] = [params.width, params.height]
//   const centerX = random.real(w * 0.1, w * 0.9)
//   const centerY = random.real(h * 0.1, h * 0.9)
//   let angle: number
//   if (centerX < w / 2 && centerY < h / 2) {
//     angle = random.real(0.1, 0.4)
//   } else if (centerX > w / 2 && centerY < h / 2) {
//     angle = random.real(0.6, 0.9)
//   } else if (centerX > w / 2 && centerY > h / 2) {
//     angle = random.real(1.1, 1.4)
//   } else {
//     angle = random.real(1.6, 1.9)
//   }
//   angle *= pi

//   const container = new Container()
//   container.addChild(createGradientFill())
//   container.addChild(createRays())
//   return { container }

//   function createGradientFill() {
//     return renderCanvas((ctx) => {
//       const gradient = ctx.createConicGradient(angle, centerX, centerY)
//       const palette = [randomColor(), randomColor(), randomColor()]
//       gradient.addColorStop(0, palette[0].toRgbaString())
//       gradient.addColorStop(random.real(0.3, 0.7), palette[1].toRgbaString())
//       gradient.addColorStop(1, palette[2].toRgbaString())
//       ctx.fillStyle = gradient
//       ctx.fillRect(0, 0, w, h)
//     }, params)
//   }

//   function createRays() {
//     const rayContainer = new Container()
//     rayContainer.position.set(centerX - w / 2, -centerY + h / 2)
//     rayContainer.rotation = -angle

//     const lineLength = hypot(w, h)
//     let rotation = 0
//     while (rotation < 2 * pi) {
//       const graphics = new Graphics().lineStyle({
//         width: 1,
//         color: gray(random.bool() ? 20 : 240),
//         alpha: random.real(64, 255) / 255,
//         cap: LINE_CAP.SQUARE,
//       })
//       graphics.rotation = rotation

//       const lineWidth = random.real(1, 20)
//       for (let i = -lineWidth; i <= lineWidth; i++) {
//         graphics.moveTo(0, 0).lineTo(lineLength, i)
//       }

//       rayContainer.addChild(graphics)
//       rotation += random.real(0.1, 0.3)
//     }

//     return rayContainer
//   }

//   function randomColor() {
//     return new Color([
//       random.realZeroToOneInclusive(),
//       random.realZeroToOneInclusive(),
//       random.realZeroToOneInclusive(),
//       random.real(64, 255) / 255,
//     ])
//   }
// })
