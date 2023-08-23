import { coin, IRandom } from "@thi.ng/random"

export function asset(path: string) {
  return new URL(`/assets/${path}`, import.meta.url).href
}

export function map(x: number, x0: number, x1: number, y0: number, y1: number): number {
  return ((x - x0) / (x1 - x0)) * (y1 - y0) + y0
}

export function sign(random: IRandom) {
  return coin(random) ? -1 : 1
}
