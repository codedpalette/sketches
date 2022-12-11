export {};

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
