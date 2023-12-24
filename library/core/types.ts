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

/** Parameters for controlling renderer's size */
export type SizeParams = {
  /** Actual framebuffer width (in pixels) */
  width: number
  /** Actual framebuffer height (in pixels) */
  height: number
  /** Renderer's resolution / device pixel ratio */
  resolution: number
}

/** Parameters for controlling rendering process */
export type RenderParams = {
  /** Canvas element to render to */
  view?: HTMLCanvasElement
  /** Enable WebGL antialiasing */
  antialias: boolean
  /** Whether or not to scale bounding box when setting resolution */
  scaleBbox: boolean
  /** Whether or not to resize canvas css dimensions when resizing renderer*/
  resizeCSS: boolean
  /** Enable/disable generating new sketches with a click on canvas */
  clickable: boolean
}

export type SketchParams = SizeParams & RenderParams
