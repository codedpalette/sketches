import { Angle, cos, Degrees, sin, unit } from "mathjs";

export function deg(degrees: number): Degrees {
  return unit(degrees, "deg") as Degrees;
}

export function fromPolar(r: number, theta: Angle): { x: number; y: number } {
  return { x: r * cos(theta), y: r * sin(theta) };
}
