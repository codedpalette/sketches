import { Color } from "pixi.js"
import { Random as BaseRandom } from "random-js"
import { createNoise2D, createNoise3D, createNoise4D } from "simplex-noise"
import { Vector2 } from "threejs-math"

export class Random extends BaseRandom {
  sign() {
    return this.bool() ? -1 : 1
  }

  color() {
    return new Color([this.realZeroToOneInclusive(), this.realZeroToOneInclusive(), this.realZeroToOneInclusive()])
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

  vec2(min = 0, max = 1) {
    return new Vector2(this.real(min, max), this.real(min, max))
  }
}

export const noise2d = (random: Random) => createNoise2D(() => random.realZeroToOneExclusive())
export const noise3d = (random: Random) => createNoise3D(() => random.realZeroToOneExclusive())
export const noise4d = (random: Random) => createNoise4D(() => random.realZeroToOneExclusive())
