import p5 from "p5"

export default (p: p5) => {
  let color: p5.Color

  p.setup = () => {
    p.createCanvas(1250, 1250, p.WEBGL)
    p.background(255)
    p.rectMode(p.CENTER)
    color = p.randomColor()
  }

  p.mouseClicked = () => {
    color = p.randomColor()
  }

  p.draw = () => {
    p.scale(p.width / 2, p.height / 2)
    p.fill(color)
    p.noStroke()
    p.circle(0, 0, 2, 48)
    p.stroke("black")
    p.strokeWeight(2)
    p.fill("white")
    p.rect(0, 0, 1, 1)
  }
}
