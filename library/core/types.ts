import { Box } from "@flatten-js/core"
import { Container, ICanvas, WebGLRenderer } from "pixi.js"

import { Random } from "./random"

export type SketchType = "webgl" | "pixi" | "canvas"

/**
 * Type for sketch update function
 * @param totalTime total elapsed time in seconds
 * @param deltaTime time elapsed since last frame in seconds
 */
export type UpdateFn = (totalTime: number, deltaTime: number) => void

/** Single instance of a sketch */
export type SketchInstance = {
  /** Pixi.js {@link Container} */
  container: Container
  /** Sketch update function */
  update?: UpdateFn
}

/** Environment for generating sketch instances */
export type SketchEnv<T extends ICanvas = HTMLCanvasElement> = {
  /** Pixi.js {@link WebGLRenderer} instance */
  renderer: WebGLRenderer<T>
  /** {@link Random} instance to enable repeatability of RNG values */
  random: Random
  /** Bounding box of sketch's model space */
  bbox: Box
}

/**
 * Function for generating sketch instances
 * @param {SketchEnv} env Environment for sketch
 * @returns {SketchInstance} Specific instance of a sketch
 */
export type SketchFactory<T extends ICanvas = HTMLCanvasElement> = (env: SketchEnv<T>) => SketchInstance

/** Parameters for controlling sketch's size */
export type SizeParams = {
  /** Sketch's width (in pixels) */
  width: number
  /** Sketch's height (in pixels) */
  height: number
  /** Renderer's resolution / device pixel ratio */
  resolution?: number
}
