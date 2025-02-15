import p5 from "p5"

export default (p: p5) => {
  const gridSize = 50
  p.setup = () => {
    p.setAttributes({ antialias: true })
    p.createCanvas(1250, 1250, "webgl")
    p.background(255)
  }

  p.draw = () => {
    p.scale(1, -1)
    p.fill(0)
    p.ellipse(0, 0, gridSize, gridSize)
    p.scale(gridSize, gridSize)
    //p.rotate(Math.PI / 4)
    //p.translate(-p.width / gridSize / 2, -p.height / gridSize / 2)

    drawGrid(p.width / gridSize, p.height / gridSize)
  }

  function drawGrid(width: number, height: number) {
    for (let x = -width / 2; x <= width / 2; x++) {
      p.line(x, -height / 2, x, height / 2)
    }
    for (let y = -height / 2; y <= height / 2; y++) {
      p.line(-width / 2, y, width / 2, y)
    }
  }
}

// import { pixi } from "library/core/sketch"
// import { Container, Graphics } from "pixi.js"

// export default pixi(({ random, bbox }) => {
//   const container = new Container()
//   const w = bbox.width / 16
//   const h = bbox.height / 16

//   const heartContainer = container.addChild(new Container())
//   const subHeartContainer = container.addChild(new Container())
//   heartContainer.rotation = Math.PI / 4
//   heartContainer.scale.set(w, h)
//   subHeartContainer.rotation = Math.PI / 4
//   subHeartContainer.scale.set(w / 2, h / 2)

//   heartContainer.addChild(drawHeart()).fill({ color: "red" })
//   //heartContainer.addChild(drawHeart()).fill({ color: "white" }).position.set(1, 1)
//   //heartContainer.addChild(drawHeart()).fill({ color: "white" }).position.set(0, 2)
//   for (let i = 0; i < 5; i++) {
//     const x = random.integer(0, 5) * random.sign()
//     const y = random.integer(0, 5) * random.sign()
//     subHeartContainer
//       .addChild(drawHeart())
//       .fill({ color: "white", alpha: 0.5 })
//       .stroke({ color: "black", alpha: 0.5, width: 0.1 })
//       .position.set(x, y)
//   }

//   return { container }

//   function drawHeart() {
//     return new Graphics().poly([
//       { x: -1, y: 1 },
//       { x: 0, y: 1 },
//       { x: 0, y: 0 },
//       { x: 1, y: 0 },
//       { x: 1, y: -1 },
//       { x: -1, y: -1 },
//     ])
//   }
// })
