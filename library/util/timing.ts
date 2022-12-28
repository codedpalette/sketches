import is from "@sindresorhus/is";
import { finalize, isObservable } from "rxjs";

export function timed<T>(target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
  const scopeName = is.function_(target) ? `static ${target.name}` : target.constructor.name;
  const timerName = `${scopeName}::${propertyKey}`;
  const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
  descriptor.value = (
    is.asyncFunction(originalMethod)
      ? async function (this: unknown, ...args: unknown[]) {
          const t0 = start(timerName);
          try {
            const result = await originalMethod.apply(this, args);
            return processResult(result, t0, timerName);
          } catch (err) {
            log(t0, timerName);
            throw err;
          }
        }
      : function (this: unknown, ...args: unknown[]) {
          const t0 = start(timerName);
          try {
            const result = originalMethod.apply(this, args);
            return processResult(result, t0, timerName);
          } catch (err) {
            log(t0, timerName);
            throw err;
          }
        }
  ) as T;
  return descriptor;
}

function processResult(result: unknown, t0: number, timerName: string): unknown {
  if (isObservable(result)) {
    return result.pipe(finalize(() => log(t0, timerName)));
  }
  log(t0, timerName);
  return result;
}

function start(timerName: string): number {
  console.log(`[timer] [${timerName}]: begin`);
  return performance.now();
}

function log(t0: number, timerName: string) {
  console.log(`[timer] [${timerName}]: timer ${((performance.now() - t0) * 0.001).toFixed(3)}s`);
}
