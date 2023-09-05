import { coin, IRandom } from "@thi.ng/random"

export function sign(random: IRandom) {
  return coin(random) ? -1 : 1
}

export function color(random: IRandom) {
  return [random.float(), random.float(), random.float()]
}
