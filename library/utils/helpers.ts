// https://vitejs.dev/guide/assets.html#new-url-url-import-meta-url
export function asset(path: string) {
  return new URL(`/assets/${path}`, import.meta.url).href
}

export function map(x: number, x0: number, x1: number, y0: number, y1: number): number {
  return ((x - x0) / (x1 - x0)) * (y1 - y0) + y0
}
