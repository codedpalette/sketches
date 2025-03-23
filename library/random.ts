import p5 from "p5"

p5.prototype.randomColor = function () {
  this.colorMode(this.RGB, 1)
  return this.color(this.random(), this.random(), this.random())
}
