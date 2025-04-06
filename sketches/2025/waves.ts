import p5 from "p5"

interface Vector2 {
  x: number
  y: number
}

export default (p: p5) => {
  let backgroundGraphics: p5.Graphics
  let waveGraphics: p5.Graphics
  p.setup = () => {
    p.createCanvas(1250, 1250, p.WEBGL)
    p.background(255)
    p.noLoop()
    p.noiseSeed(Date.now())
    backgroundGraphics = p.createGraphics(p.width, p.height, p.WEBGL)
    backgroundGraphics.scale(p.width / 2, p.height / 2)
    waveGraphics = p.createGraphics(p.width, p.height, p.WEBGL)
    waveGraphics.scale(p.width / 2, p.height / 2)
    drawWaveBackground()
    drawWaves()
  }

  p.mouseClicked = () => {
    p.noiseSeed(p.random(1000))
    backgroundGraphics.clear()
    waveGraphics.clear()
    drawWaveBackground()
    drawWaves()
    p.clear()
    p.redraw()
  }

  p.draw = () => {
    p.scale(p.width / 2, -p.height / 2)
    p.noStroke()
    drawSeaColor()
    const backgroundImage = backgroundGraphics.get()
    const waveImage = waveGraphics.get()
    backgroundImage.mask(waveImage)
    p.image(backgroundImage, -1, -1, 2, 2)
    // Sunset color
    p.fill("#F6D55C")
    p.rect(-1, 1, 2, -1)
    // TODO: Sky with clouds and moon
    p.filter("blur", 0.1)
  }

  function drawSeaColor() {
    const stop = -p.random(0.25, 0.75)
    p.beginShape(p.QUAD_STRIP)
    p.fill("#203A46")
    p.vertex(-1, 0)
    p.vertex(1, 0)
    p.fill("#2E4B6D")
    p.vertex(-1, stop)
    p.vertex(1, stop)
    p.fill("#3B6978")
    p.vertex(-1, -1)
    p.vertex(1, -1)
    p.endShape()
  }

  function drawWaves() {
    const waveSpacing = 0.04
    let y = -1.2

    waveGraphics.noStroke()
    while (y < 0) {
      waveGraphics.fill(255, p.random(100, 255))
      //waveGraphics.stroke(0, p.random(100, 255))
      const waveAmplitude = p.map(y, -1, 0, waveSpacing, waveSpacing * 0.1)
      const wavePoints = p.map(y, -1, 0, 100, 10)
      const noiseScale = p.map(y, -1, 0, 1, 10)
      //waveGraphics.strokeWeight(1 + Math.abs(y) * 3)
      drawCurve(waveGraphics, y, waveAmplitude * 2, wavePoints, { x: noiseScale, y: 100 })
      y += waveAmplitude
    }
  }

  function drawCurve(p: p5 | p5.Graphics, yStart: number, amplitude: number, numPoints: number, noiseScale: Vector2) {
    const b = yStart
    const a = p.random(1.5, 2)
    const tStart = p.random(Math.PI * 0, Math.PI * 0.4)
    const tEnd = p.random(Math.PI * 0.6, Math.PI * 1)
    const step = (tEnd - tStart) / numPoints
    const wavePoints: Vector2[] = []
    const outerPoints: Vector2[] = []
    for (let i = 0; i <= numPoints; i++) {
      const t = i * step + tStart
      const x = Math.cos(t) * a
      const y = Math.sin(t) * b
      const noise = p.noise((x + 1) * noiseScale.x, yStart * noiseScale.y) * 2 - 1 // [0, 1]
      const noiseAmp = Math.abs(noise) * amplitude
      wavePoints.push({ x, y: y + noiseAmp })
      outerPoints.unshift({ x, y })
    }
    p.beginShape()
    p.push()
    p.fill(0, 0)
    p.stroke(0, 0)
    p.vertex(outerPoints[outerPoints.length - 1].x, outerPoints[outerPoints.length - 1].y)
    p.pop()
    for (const point of wavePoints) {
      p.curveVertex(point.x, point.y)
    }
    p.push()
    p.fill(0, 0)
    p.stroke(0, 0)
    p.vertex(outerPoints[0].x, outerPoints[0].y)
    for (const point of outerPoints) {
      p.curveVertex(point.x, point.y)
    }
    p.pop()
    p.endShape()
  }

  function drawWaveBackground() {
    backgroundGraphics.noStroke()
    backgroundGraphics.fill("black")
    backgroundGraphics.rect(-1, 0, 2, -1)
    backgroundGraphics.fill("#F6D55C")
    backgroundGraphics.beginShape()

    const rayAngle = Math.PI * 0.5 * 0.33
    const rotationAngle = Math.PI * -0.125
    const x0 = 0.5
    const y0 = 0.25
    const rightVertices: Vector2[] = []
    const leftVertices: Vector2[] = []
    //backgroundGraphics.vertex(x0, y0)
    for (let i = 0; i >= -1.5; i -= 0.01) {
      const y = i
      const xLeft = x0 + Math.abs(i - y0) * Math.tan(rotationAngle - rayAngle / 2)
      const xRight = x0 + Math.abs(i - y0) * Math.tan(rotationAngle + rayAngle / 2)
      const nRight = p.noise(y * 1000) * 0.2
      const nLeft = p.noise(y * 1000, 1000) * 0.2
      rightVertices.push({ x: xRight + nRight, y })
      leftVertices.unshift({ x: xLeft - nLeft, y })
    }
    for (const vertex of rightVertices) {
      //backgroundGraphics.fill(p.random(200, 255))
      backgroundGraphics.vertex(vertex.x, vertex.y)
    }
    for (const vertex of leftVertices) {
      //backgroundGraphics.fill(p.random(200, 255))
      backgroundGraphics.vertex(vertex.x, vertex.y)
    }
    backgroundGraphics.endShape()
    backgroundGraphics.filter("blur", 5)
  }
}
