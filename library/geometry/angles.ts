import { cos, sin, unit, Unit } from "mathjs"

type Degrees = Unit & { __unit: "deg" }

export function deg(degrees: number): Degrees {
  return unit(degrees, "deg") as Degrees
}

export function fromPolar(r: number, theta: number | Degrees): { x: number; y: number } {
  return { x: r * cos(theta), y: r * sin(theta) }
}
