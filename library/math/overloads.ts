import { MathNumericType } from "mathjs";

declare module "mathjs" {
  export interface MathJsStatic {
    multiply<T extends MathNumericType[]>(x: T, y: MathNumericType): T;
    multiply<T extends MathNumericType[]>(x: MathNumericType, y: T): T;

    min<T extends MathNumericType>(A: T[]): T;
    max<T extends MathNumericType>(A: T[]): T;
  }
}
