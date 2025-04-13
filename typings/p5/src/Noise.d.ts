// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class Noise {
    /**
     *   Generate a buffer with random values.
     *
     *   @param [type] - the type of noise (white, pink,
     *   brown)
     */
    constructor(type?: string)
    type(type: string): void

    /**
     *   Adjust the amplitude of the noise source.
     *   @param amplitude Set the amplitude between 0 and
     *   1.0. Or, pass in an object such as an oscillator
     *   to modulate amplitude with an audio signal.
     */
    amp(amplitude: number): void

    /**
     *   Starts the noise source.
     */
    start(): void

    /**
     *   Stops the noise source.
     */
    stop(): void
  }
}
