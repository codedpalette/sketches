import p5 from "p5"

export default (p: p5) => {
  p.setup = () => {
    p.createCanvas(1250, 1250, p.WEBGL)
    p.background(255)
    p.noLoop()
    p.noiseSeed(Date.now())
  }

  p.mouseClicked = () => {
    p.noiseSeed(p.random(1000))
    p.clear()
    p.redraw()
  }

  const waveSpace = 0.05
  const waveFrequency = 10

  p.draw = () => {
    p.scale(p.width / 2, -p.height / 2)
    p.noStroke()
    p.fill("black")
    p.rect(-1, 0, 2, -1)
    p.fill("white")
    p.triangle(0, 0.25, -0.5, -1, 0.5, -1)
    p.filter("blur", 50)

    p.stroke(0)
    p.fill("#203A46")
    let y = 0
    while (y >= -1) {
      const noiseFactor = 10 //p.map(y, -1, 0, 100, 10)
      const waveDetail = p.map(y, -1, 0, 0.01, 0.1)
      const waveAmplitude = p.map(y, -1, 0, waveSpace, waveSpace * 0.1)
      const freq = p.map(y, -1, 1, waveFrequency, waveFrequency * 40)
      p.strokeWeight(1 + Math.abs(y) * 4)
      p.beginShape()
      for (let x = -1 - waveDetail; x <= 1 + waveDetail * 2; x += waveDetail) {
        const wave = Math.cos(x * freq) * waveAmplitude
        const n = (p.noise(x * noiseFactor, y * 100) - 0.5) * 4 * waveAmplitude
        //const mix = y + 1
        //const yVertex = y + p.lerp(n, wave, mix)
        const yVertex = y + n + wave * 0.4
        p.curveVertex(x, yVertex)
      }
      p.endShape()
      y -= waveAmplitude
    }
    p.filter("blur", 0.5)
  }
}
