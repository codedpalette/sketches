import { Random as BaseRandom } from "random-js"
import { createNoise2D, createNoise3D, createNoise4D } from "simplex-noise"
import { Vector2 } from "threejs-math"

export class Random extends BaseRandom {
  sign() {
    return this.bool() ? -1 : 1
  }

  color() {
    return [this.realZeroToOneInclusive(), this.realZeroToOneInclusive(), this.realZeroToOneInclusive()]
  }

  realZeroTo(max: number, inclusive?: boolean) {
    return this.real(0, max, inclusive)
  }

  minmax(minmax: number, inclusive?: boolean) {
    return this.real(-minmax, minmax, inclusive)
  }

  //https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
  normal(mean = 0, std = 1) {
    const u = 1 - this.realZeroToOneExclusive()
    const v = this.realZeroToOneExclusive()
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    return z * std + mean
  }

  // Returns random point on the unit circle
  vec2() {
    const angle = this.realZeroTo(Math.PI * 2)
    return new Vector2(Math.cos(angle), Math.sin(angle))
  }
}

export const noise2d = (random: Random) => createNoise2D(() => random.realZeroToOneExclusive())
export const noise3d = (random: Random) => createNoise3D(() => random.realZeroToOneExclusive())
export const noise4d = (random: Random) => createNoise4D(() => random.realZeroToOneExclusive())
