import { MersenneTwister19937, Random } from "random-js";

declare module "random-js" {
  interface Random {
    sign(): -1 | 1;
  }
}

export const random = new Random(MersenneTwister19937.autoSeed());

Random.prototype.sign = function () {
  return this.bool() ? 1 : -1;
};
