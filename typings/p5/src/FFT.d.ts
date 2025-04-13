// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class FFT {
    /**
     *   Analyze the frequency spectrum and waveform of
     *   sounds.
     *
     *   @param [fftSize] FFT anaylsis size. Must be a
     *   power of two between 16 and 1024. Defaults to 32.
     */
    constructor(fftSize?: number)

    /**
     *   Returns the frequency spectrum of the input
     *   signal.
     *   @return Array of amplitude values from 0 to 1.
     */
    analyze(): any[]

    /**
     *   Returns an array of sample values from the input
     *   audio.
     *   @return Array of sample values from -1 to -1.
     */
    waveform(): any[]
  }
}
