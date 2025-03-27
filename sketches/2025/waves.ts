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

  p.draw = () => {
    const waveSpacing = 0.05
    p.scale(p.width / 2, -p.height / 2)
    // TODO: Mask background
    drawWaveBackground()
    p.stroke(0, 50)
    p.fill("#203A46")

    let y = 0
    while (y >= -1 - waveSpacing) {
      const waveAmplitude = p.map(y, -1, 0, waveSpacing, waveSpacing * 0.1)
      const wavePoints = p.map(y, -1, 0, 100, 10)
      const noiseScale = p.map(y, -1, 0, 1, 100)
      const noiseOffset = 0.5 //p.map(y, -1, 0, 0, 0.5)
      p.strokeWeight(1 + Math.abs(y) * 4)
      drawWave(y, waveAmplitude, wavePoints, noiseScale, noiseOffset)
      y -= waveAmplitude
    }
    //p.filter("blur", 1)
  }

  function drawWave(yStart: number, amplitude: number, numPoints: number, noiseScale: number, noiseOffset: number) {
    p.beginShape()
    const pointStep = 2 / numPoints
    p.curveVertex(-1, yStart)
    p.curveVertex(-1, yStart)
    for (let i = 0; i <= numPoints; i++) {
      const x = -1 + i * pointStep
      const noise = (p.noise((x + 1) * noiseScale, yStart * noiseScale) - noiseOffset) * amplitude * 2
      const y = yStart + noise // TODO: Add curvature
      p.curveVertex(x, y)
    }
    p.curveVertex(1, yStart)
    p.curveVertex(1, yStart)
    p.endShape()
  }

  function drawWaveBackground() {
    p.noStroke()
    p.fill("black")
    p.rect(-1, 0, 2, -1)
    p.fill("white")
    p.triangle(0, 0.25, -0.5, -1, 0.5, -1)
    p.filter("blur", 10)
  }
}
