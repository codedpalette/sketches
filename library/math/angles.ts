import { cos, sin, unit, Unit } from "mathjs";

type Degrees = Unit & { __unit: "deg" };
type Radians = Unit & { __unit: "rad" };
type Angle = Degrees | Radians;

export function deg(degrees: number): Degrees {
  return unit(degrees, "deg") as Degrees;
}

export function fromPolar(r: number, theta: Angle): { x: number; y: number } {
  return { x: r * cos(theta), y: r * sin(theta) };
}
