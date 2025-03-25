import p5 from "p5"

export default (p: p5) => {
  p.setup = () => {
    p.createCanvas(1250, 1250, p.WEBGL)
    p.background(255)
    p.rectMode(p.CENTER)
    p.noLoop()
    p.noiseSeed(Date.now())
  }

  p.mouseClicked = () => {
    p.noiseSeed(p.random(1000))
    p.clear()
    p.redraw()
  }

  const waveSpace = 0.05
  const waveDetail = 0.01
  const waveFrequency = 100

  p.draw = () => {
    p.scale(p.width / 2, -p.height / 2)
    p.stroke(0)
    p.noFill()
    p.strokeWeight(1)
    let y = -1
    let waveAmplitude = waveSpace
    while (y <= 1) {
      const freq = 100 //p.random(50, 100)
      const phase = 0 //p.random(0, 2 * Math.PI)
      const amp = waveAmplitude * 0.5 // * p.random(0.3, 0.5)
      p.beginShape()
      for (let x = -1 - waveDetail; x <= 1 + waveDetail * 2; x += waveDetail) {
        const n = (p.noise(x * 1000) - 0.5) * 2
        //const yVertex = y + (n - 0.5) * waveSpace * 2 //y + Math.cos(x * 100) * 0.05
        const yVertex = y + Math.cos(x * freq + phase) * amp //+ n * waveSpace * 0.3
        p.curveVertex(x, yVertex)
      }
      p.endShape()
      waveAmplitude = p.map(y, -1, 1, waveSpace, waveSpace * 0.5)
      y += waveAmplitude
    }
  }
}
