declare namespace math {
  type Degrees = Unit & { __unit: "deg" };
  type Radians = Unit & { __unit: "rad" };
  type Angle = Degrees | Radians;
  interface MathJsStaticOverrides extends Omit<MathJsStatic, "sin" | "cos" | "tan"> {
    multiply<T extends MathNumericType[]>(x: T, y: MathNumericType): T;
    multiply<T extends MathNumericType[]>(x: MathNumericType, y: T): T;
    divide<T extends MathNumericType[]>(x: T, y: MathNumericType): T;

    min<T extends MathNumericType>(A: T[]): T;
    min<T extends MathType>(...args: T[]): T;
    max<T extends MathNumericType>(A: T[]): T;
    max<T extends MathType>(...args: T[]): T;

    pow<T extends MathType>(x: T, y: number): T;

    sin(x: Angle): number;
    cos(x: Angle): number;
    tan(x: Angle): number;
  }
}

declare module "mathjs" {
  declare const mathjs: math.MathJsStaticOverrides;
  //export as namespace math;
  export = mathjs;

  export type Degrees = math.Degrees;
  export type Radians = math.Radians;
  export type Angle = math.Angle;
}
