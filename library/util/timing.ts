/* eslint-disable 
@typescript-eslint/ban-types, 
@typescript-eslint/no-explicit-any, 
@typescript-eslint/no-unsafe-member-access, 
@typescript-eslint/restrict-plus-operands,
@typescript-eslint/restrict-template-expressions */
// Code from https://github.com/norbornen/execution-time-decorator

export function sync_timer(
  target: any,
  propertyKey: string,
  propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
  propertyDescriptor = propertyDescriptor || Object.getOwnPropertyDescriptor(target, propertyKey);

  const timerName =
    (target instanceof Function ? `static ${target.name}` : target.constructor.name) + `::${propertyKey}`;
  const originalMethod = propertyDescriptor.value as Function;
  propertyDescriptor.value = function (...args: any[]) {
    const t0 = performance.now();
    console.log(`[timer] [${timerName}]: begin`);
    try {
      const result = originalMethod.apply(this, args) as unknown;
      console.log(`[timer] [${timerName}]: timer ${((performance.now() - t0) * 0.001).toFixed(3)}s`);
      return result;
    } catch (err) {
      console.log(`[timer] [${timerName}]: timer ${((performance.now() - t0) * 0.001).toFixed(3)}s`);
      throw err;
    }
  };
  return propertyDescriptor;
}

export function async_timer(
  target: any,
  propertyKey: string,
  propertyDescriptor: PropertyDescriptor
): PropertyDescriptor {
  propertyDescriptor = propertyDescriptor || Object.getOwnPropertyDescriptor(target, propertyKey);

  const timerName =
    (target instanceof Function ? `static ${target.name}` : target.constructor.name) + `::${propertyKey}`;
  const originalMethod = propertyDescriptor.value as Function;
  propertyDescriptor.value = async function (...args: any[]) {
    const t0 = performance.now();
    console.log(`[timer] [${timerName}]: begin`);
    try {
      const result = (await originalMethod.apply(this, args)) as unknown;
      console.log(`[timer] [${timerName}]: timer ${((performance.now() - t0) * 0.001).toFixed(3)}s`);
      return result;
    } catch (err) {
      console.log(`[timer] [${timerName}]: timer ${((performance.now() - t0) * 0.001).toFixed(3)}s`);
      throw err;
    }
  };
  return propertyDescriptor;
}
