import { cos, sin, Unit, unit } from "mathjs";

type Degrees = Unit & { __unit: "deg" };
type Radians = Unit & { __unit: "rad" };

export function deg(degrees: number): Degrees {
  return unit(degrees, "deg") as Degrees;
}

export function fromPolar(r: number, theta: Degrees | Radians): { x: number; y: number } {
  return { x: r * cos(theta), y: r * sin(theta) };
}
