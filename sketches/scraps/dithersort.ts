import { run } from "drawing/sketch"
import getPixels from "get-pixels"
import { Color, Container, Sprite, Texture } from "pixi.js"
import { hex } from "color-convert"
import { random } from "utils/random"
import { add, distance, multiply, subtract } from "mathjs"
import pic from "/assets/dither/pic.jpg"
import { setBackground } from "drawing/pixi"

getPixels(pic, (err, pixels) => {
  if (err) {
    console.log("Bad image path")
    return
  }

  run((params) => {
    const brightThresh = random.integer(30, 50)
    const mainColor = [226, 0, 35].map((v) => v / 255)
    const secondaryColor = [255, 238, 44].map((v) => v / 255)
    const diffusor = {
      width: 3,
      height: 2,
      pixels: [0, 0, 7, 3, 5, 1].map((val) => val / 16),
    }

    sortPixels()
    matrixErrorDiffusion()

    const texture = Texture.fromBuffer(pixels.data, pixels.shape[0], pixels.shape[1])
    const sprite = new Sprite(texture)
    sprite.scale = { x: 1, y: -1 }
    sprite.anchor.set(0.5, 0.5)
    sprite.position.set(0, 0)

    const container = new Container()
    setBackground(container, "white", params)
    container.addChild(sprite)
    return { container }

    function sortPixels() {
      for (let y = 0; y < pixels.shape[1]; y++) {
        const pixelColors = [],
          pixelValues = []
        for (let x = 0; x < pixels.shape[0]; x++) {
          const color = new Color(getPixelAt(x, y))
          pixelColors.push(color)
          pixelValues.push(bri(color))
        }
        let xStart = 0,
          xEnd = 0
        while (xEnd < params.width - 1) {
          xStart = pixelValues.findIndex((e, i) => i > xStart && e > brightThresh)
          xEnd = pixelValues.findIndex((e, i) => i > xStart && e < brightThresh)
          if (xStart < 0 || xEnd < 0) break

          const sorted = pixelColors.slice(xStart, xEnd).sort((a, b) => bri(a) - bri(b))
          sorted.forEach((color, i) => {
            setPixelAt(xStart + i, y, color.toRgbArray())
          })

          xStart = xEnd + 1
        }
      }
    }

    function matrixErrorDiffusion() {
      for (let y = 0; y < pixels.shape[1]; y++) {
        for (let x = 0; x < pixels.shape[0]; x++) {
          const color = getPixelAt(x, y)
          const quantized = quantize(color)
          const error = subtract(color, quantized)

          for (let i = 0; i < diffusor.height; i++) {
            for (let j = -1; j < diffusor.width - 1; j++) {
              if (inBounds(x + j, y + i)) {
                const offsetPixel = getPixelAt(x + j, y + i)
                const diffuseFactor = diffusor.pixels[j + 1 + i * diffusor.width]
                const newColor = add(multiply(error, diffuseFactor), offsetPixel)
                setPixelAt(x + j, y + i, newColor)
              }
            }
          }

          setPixelAt(x, y, quantized)
        }
      }
    }

    function quantize(color: number[]) {
      const distanceToMain = distance(color, mainColor)
      const distanceToSecond = distance(color, secondaryColor)
      return distanceToMain < distanceToSecond ? mainColor : secondaryColor
    }

    function inBounds(x: number, y: number) {
      return x > 0 && x < pixels.shape[0] && y < pixels.shape[1]
    }

    function getPixelAt(x: number, y: number) {
      return [0, 1, 2].map((i) => pixels.get(x, y, i) / 255)
    }

    function setPixelAt(x: number, y: number, newColor: number[]) {
      newColor.forEach((ch, i) => pixels.set(x, y, i, ch * 255))
    }

    function bri(color: Color) {
      return hex.hsv(color.toHex())[2]
    }
  })
})
