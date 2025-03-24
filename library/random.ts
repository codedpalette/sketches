import p5 from "p5"

declare module "p5" {
  // eslint-disable-next-line jsdoc/require-jsdoc
  interface p5InstanceExtensions {
    /**
     * Generates a random color. Sets colorMode(RGB, 1)
     */
    randomColor(): p5.Color
  }
}

p5.prototype.randomColor = function () {
  this.colorMode(this.RGB, 1)
  return this.color(this.random(), this.random(), this.random())
}
