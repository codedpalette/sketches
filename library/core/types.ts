import { Box } from "@flatten-js/core"
import { Container, Renderer } from "pixi.js"

import { Random } from "./random"

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
export type SketchEnv = {
  /** Pixi.js {@link Renderer} instance */
  renderer: Renderer
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
export type SketchFactory = (env: SketchEnv) => SketchInstance

/** Parameters for controlling sketch's size */
export type SizeParams = {
  /** Sketch's width (in pixels) */
  width: number
  /** Sketch's height (in pixels) */
  height: number
  /** Renderer's resolution / device pixel ratio */
  resolution?: number
}

export type Canvas = HTMLCanvasElement | OffscreenCanvas

/**
 * Type guard to distinguish between HTML and offscreen canvas
 * @param canvas {@link HTMLCanvasElement} or {@link OffscreenCanvas}
 * @returns true if `canvas` is {@link HTMLCanvasElement}
 */
export function isHTMLCanvas(canvas: Canvas): canvas is HTMLCanvasElement {
  return (canvas as HTMLCanvasElement).isConnected !== undefined
}

/** Parameters for controlling rendering process */
export type RenderParams<ICanvas extends Canvas = Canvas> = {
  /** Enable WebGL antialiasing */
  antialias: boolean
  /** Whether or not to resize canvas css dimensions when resizing renderer*/
  resizeCSS: boolean
  /** Optional canvas for renderer to render onto */
  canvas?: ICanvas
}

/** Parameters for controlling sketch running */
export type RunnerParams = {
  /** Enable/disable generating new sketches with a click on canvas */
  clickable: boolean
  /** Enable/disable running an update loop */
  updatable: boolean
}
