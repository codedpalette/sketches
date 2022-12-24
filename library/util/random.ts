declare global {
  interface Array<T> {
    random(): T;
  }
}

if (!Array.prototype.random) {
  Array.prototype.random = function <T>(this: T[]): T {
    return this[(this.length * Math.random()) | 0];
  };
}

export function random(_min?: number, _max?: number): number {
  const min = _min || 0;
  const max = _max || 1;
  return Math.random() * (max - min) + min;
}
