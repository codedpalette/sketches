import { finalize, isObservable } from "rxjs";

function isPromise(val: unknown): val is Promise<unknown> {
  return !!val && (typeof val === "object" || typeof val === "function") && "then" in val;
}

export function timed<T>(target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
  descriptor = descriptor || Object.getOwnPropertyDescriptor(target, propertyKey);
  const scopeName = target instanceof Function ? `static ${target.name}` : target.constructor.name;
  const timerName = `${scopeName}::${propertyKey}`;
  const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
  const log = (t0: number) => {
    console.log(`[timer] [${timerName}]: timer ${((performance.now() - t0) * 0.001).toFixed(3)}s`);
  };
  descriptor.value = function (this: unknown, ...args: unknown[]) {
    const t0 = performance.now();
    console.log(`[timer] [${timerName}]: begin`);
    try {
      const result = originalMethod.apply(this, args);
      if (isObservable(result)) {
        return result.pipe(finalize(() => log(t0)));
      }
      if (isPromise(result)) {
        return result.finally(() => log(t0));
      }
      log(t0);
      return result;
    } catch (err) {
      log(t0);
      throw err;
    }
  } as T;
  return descriptor;
}
