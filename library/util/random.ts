import { Vector2 } from "geometry/vectors";
import { cos, log, pi, sin, sqrt } from "mathjs";
import { MersenneTwister19937, Random } from "random-js";
import { createNoise2D, createNoise3D, createNoise4D } from "simplex-noise";

declare module "random-js" {
  interface Random {
    sign(): -1 | 1;
    normal(mean?: number, std?: number): number;
    random2d(): Vector2;
  }
}

export const random = new Random(MersenneTwister19937.autoSeed());
export const noise2d = createNoise2D(() => random.realZeroToOneExclusive());
export const noise3d = createNoise3D(() => random.realZeroToOneExclusive());
export const noise4d = createNoise4D(() => random.realZeroToOneExclusive());

Random.prototype.sign = function () {
  return this.bool() ? 1 : -1;
};

//https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
Random.prototype.normal = function (mean = 0, std = 1) {
  const u = 1 - this.realZeroToOneExclusive();
  const v = this.realZeroToOneExclusive();
  const z = (sqrt(-2 * log(u)) as number) * cos(2 * pi * v);
  return z * std + mean;
};

Random.prototype.random2d = function () {
  const angle = this.real(0, pi * 2);
  return [cos(angle), sin(angle)];
};
