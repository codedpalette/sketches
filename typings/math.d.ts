declare namespace math {
  export interface MathJsStatic {
    multiply<T extends MathNumericType[]>(x: T, y: MathNumericType): T;
    multiply<T extends MathNumericType[]>(x: MathNumericType, y: T): T;
    divide<T extends MathNumericType[]>(x: T, y: MathNumericType): T;

    min<T extends MathNumericType>(A: T[]): T;
    min<T extends MathType>(...args: T[]): T;
    max<T extends MathNumericType>(A: T[]): T;
    max<T extends MathType>(...args: T[]): T;

    pow<T extends MathType>(x: T, y: number): T;
  }
}
