// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class Amplitude {
    /**
     *   Get the current volume of a sound.
     *
     *   @param [smoothing] Smooth the amplitude analysis
     *   by averaging with the last analysis frame. 0.0 is
     *   no time averaging with the last analysis frame.
     */
    constructor(smoothing?: number)

    /**
     *   Connect an audio source to the amplitude object.
     *   @param input - An object that has audio output.
     */
    setInput(input: object): void

    /**
     *   Get the current amplitude value of a sound.
     *   @return Amplitude level (volume) of a sound.
     */
    getLevel(): number

    /**
     *   Get the current amplitude value of a sound.
     *   @param Smooth Amplitude analysis by averaging with
     *   the last analysis frame. Off by default.
     */
    smooth(Smooth: number): void
  }
}
