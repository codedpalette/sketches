export function map(x: number, x0: number, x1: number, y0: number, y1: number): number {
  return ((x - x0) / (x1 - x0)) * (y1 - y0) + y0;
}
