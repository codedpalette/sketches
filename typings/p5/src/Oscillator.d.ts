// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class Oscillator {
    /**
     *   Generate Sine, Triangle, Square and Sawtooth
     *   waveforms.
     *
     *   @param [frequency] frequency defaults to 440Hz
     *   @param [type] type of oscillator. Options: 'sine'
     *   (default), 'triangle', 'sawtooth', 'square'
     */
    constructor(frequency?: number, type?: string)

    /**
     *   Adjusts the frequency of the oscillator.
     *   @param frequency frequency of the oscillator in Hz
     *   (cycles per second).
     *   @param [rampTime] the time in seconds it takes to
     *   ramp to the new frequency (defaults to 0).
     */
    freq(frequency: number, rampTime?: number): void

    /**
     *   Adjusts the phase of the oscillator.
     *   @param phase phase of the oscillator in degrees
     *   (0-360).
     */
    phase(phase: number): void

    /**
     *   Sets the type of the oscillator.
     *   @param type type of the oscillator. Options:
     *   'sine' (default), 'triangle', 'sawtooth', 'square'
     */
    setType(type: string): void

    /**
     *   Adjust the amplitude of the Oscillator.
     *   @param amplitude Set the amplitude between 0 and
     *   1.0. Or, pass in an object such as an oscillator
     *   to modulate amplitude with an audio signal.
     */
    amp(amplitude: number): void

    /**
     *   Starts the oscillator. Usually from user gesture.
     */
    start(): void

    /**
     *   Stops the oscillator.
     */
    stop(): void
  }
  class SinOsc extends Oscillator {
    /**
     *   Creates a sine oscillator.
     *
     *   @param [freq] Set the frequency
     */
    constructor(freq?: number)
  }
  class TriOsc extends Oscillator {
    /**
     *   Creates a triangle oscillator.
     *
     *   @param [freq] Set the frequency
     */
    constructor(freq?: number)
  }
  class SawOsc extends Oscillator {
    /**
     *   Creates a sawtooth oscillator.
     *
     *   @param [freq] Set the frequency
     */
    constructor(freq?: number)
  }
  class SqrOsc extends Oscillator {
    /**
     *   Creates a square oscillator.
     *
     *   @param [freq] Set the frequency
     */
    constructor(freq?: number)
  }
}
