declare module "spectorjs" {
  interface IEvent<T> {
    add(callback: (element: T) => void, context?: unknown): number
    remove(id: number): void
    clear(): void
    trigger(value: T): void
  }

  interface IResultView {
    display(): void
    hide(): void
    addCapture(capture: ICapture): number
    selectCapture(captureId: number): void
    showSourceCodeError(error: string): void
  }

  class Spector {
    readonly onCapture: IEvent<ICapture>
    constructor()
    getResultUI(): IResultView
    captureNextFrame(obj: HTMLCanvasElement, quickCapture?: boolean): void
  }
}
