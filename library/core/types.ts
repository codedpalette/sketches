import { Box } from "@flatten-js/core"
import { Container, ICanvas, WebGLRenderer } from "pixi.js"

import { Random } from "./random"
import { UI } from "./ui"

/** Sketch type by API used */
export type SketchType = "pixi"

/** Context for generating sketch instances (shared between all types) */
export type SharedSketchContext = {
  /** {@link Random} instance to enable repeatability of RNG values */
  random: Random
  /** Bounding box of sketch's model space */
  bbox: Box
}

/** Pixi.js-specific context */
export type PixiContext = {
  renderer: WebGLRenderer<ICanvas>
}

/** Sketch type mapping to framework-specific context type */
export type SketchRenderingContext<T extends SketchType> = {
  pixi: PixiContext
}[T]

/** Sketch type mapping to full context type */
export type SketchContext<T extends SketchType> = SharedSketchContext & SketchRenderingContext<T>

/**
 * Type for sketch update function
 * @param totalTime total elapsed time in seconds
 * @param deltaTime time elapsed since last frame in seconds
 */
export type UpdateFn = (totalTime: number, deltaTime: number) => void

/** Single iteration of a Pixi.js sketch */
export type PixiInstance = {
  /** Pixi.js {@link Container} */
  container: Container
  /** Sketch update function */
  update?: UpdateFn
}

/** Single iteration of a sketch creator function */
export type SketchInstance<T extends SketchType> = {
  pixi: PixiInstance
}[T]

/**
 * Function for generating sketch instances
 * @param {SketchEnv} context Context for sketch
 * @returns {SketchInstance} Single instance of a sketch
 */
export type SketchCreator<T extends SketchType> = (context: SketchContext<T>) => SketchInstance<T>

/** Parameters for controlling sketch's size */
export type SizeParams = {
  /** Sketch's width (in pixels) */
  width: number
  /** Sketch's height (in pixels) */
  height: number
  /** Renderer's resolution / device pixel ratio */
  resolution?: number
}

/** Parameters for initializing sketch */
export type SketchParams = SizeParams & {
  /** Seed for initializing random generator */
  seed?: number[]
}

/** Parameters for controlling rendering process */
export type RenderParams<T extends ICanvas = ICanvas> = {
  /** Enable WebGL antialiasing */
  antialias: boolean
  /** Whether or not to resize canvas css dimensions when resizing renderer*/
  resizeCSS: boolean
  /** Optional canvas for renderer to render onto */
  canvas?: T
}

/** Parameters for exporting render as image */
export type ExportParams = Partial<SizeParams> & {
  /** A string indicating the image format. The default type is image/png */
  format?: string
}

/** Parameters for controlling sketch running */
export type RunnerParams = {
  /** Enable/disable generating new sketches with a click on canvas and provide custom click handler */
  click: ((ev: Event) => void) | false
  /** Enable/disable running an update loop */
  update: boolean
  /** Reference to UI system */
  ui?: UI
}
