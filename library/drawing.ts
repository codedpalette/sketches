import p5 from "p5"

declare module "p5" {
  // eslint-disable-next-line jsdoc/require-jsdoc
  interface p5InstanceExtensions {
    /**
     * Draws a circle with a given number of detail segments. More detail makes the circle smoother.
     * NOTE: If detail is greater than 24, the circle will not render stroke.
     * @param x x-coordinate of the center of the circle.
     * @param y y-coordinate of the center of the circle.
     * @param d diameter of the circle.
     * @param detail number of radial segments to draw (default is 24).
     */
    circle(x: number, y: number, d: number, detail?: number): p5
  }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const circle = p5.prototype.circle

p5.prototype.circle = function (x: number, y: number, d: number, detail?: number) {
  if (!detail) return circle.call(this, x, y, d)
  this.push()
  this.rotateX(Math.PI / 2)
  this.cylinder(d / 2, 0, detail, detail)
  this.pop()
  return this
}
