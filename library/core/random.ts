import { Vector, vector } from "@flatten-js/core"
import { Random as BaseRandom } from "random-js"
import {
  createNoise2D,
  createNoise3D,
  createNoise4D,
  NoiseFunction2D,
  NoiseFunction3D,
  NoiseFunction4D,
} from "simplex-noise"

/**
 * Wrapper class around {@link https://github.com/ckknight/random-js random-js} library
 */
export class Random extends BaseRandom {
  /**
   * @returns random sign factor (1 or -1)
   */
  sign(): 1 | -1 {
    return this.bool() ? -1 : 1
  }

  /**
   * @returns random color represented as array of RGB channels in range [0-1]
   */
  color(): [number, number, number] {
    return [this.realZeroToOneInclusive(), this.realZeroToOneInclusive(), this.realZeroToOneInclusive()]
  }

  /**
   * @param max upper bound of a range
   * @param inclusive if true, `max` will be inclusive
   * @returns random floating-point value in range [0, max]
   */
  realZeroTo(max: number, inclusive?: boolean): number {
    return this.real(0, max, inclusive)
  }

  /**
   * @param minmax upper and lower bound of a range
   * @param inclusive if true, `minmax` will be inclusive
   * @returns random floating-point value in range [-minmax, minmax]
   */
  minmax(minmax: number, inclusive?: boolean): number {
    return this.real(-minmax, minmax, inclusive)
  }

  /**
   * @param mean normal distribution's mean
   * @param std normal distribution's standard deviation
   * @returns a normally distributed random value.
   */
  normal(mean = 0, std = 1): number {
    // https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
    const u = 1 - this.realZeroToOneExclusive()
    const v = this.realZeroToOneExclusive()
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    return z * std + mean
  }

  /**
   * @param min lower bound of vector components
   * @param max upper bound of vector components
   * @returns a random 2D vector
   */
  vec2(min = 0, max = 1): Vector {
    return vector(this.real(min, max), this.real(min, max))
  }
}

/**
 * Factory method for creating 2D simplex noise functions
 * @param random {@link Random} instance for seeding noise
 * @returns 2D simplex noise function returning values in a [-1, 1] interval
 */
export const noise2d = (random: Random): NoiseFunction2D => createNoise2D(() => random.realZeroToOneExclusive())
/**
 * Factory method for creating 3D simplex noise functions
 * @param random {@link Random} instance for seeding noise
 * @returns 3D simplex noise function returning values in a [-1, 1] interval
 */
export const noise3d = (random: Random): NoiseFunction3D => createNoise3D(() => random.realZeroToOneExclusive())
/**
 * Factory method for creating 4D simplex noise functions
 * @param random {@link Random} instance for seeding noise
 * @returns 4D simplex noise function returning values in a [-1, 1] interval
 */
export const noise4d = (random: Random): NoiseFunction4D => createNoise4D(() => random.realZeroToOneExclusive())
