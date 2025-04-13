// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class Delay {
    /**
     *   A delay effect with parameters for feedback, and
     *   delay time.
     *
     *   @param [delayTime] The delay time in seconds
     *   between 0 and 1. Defaults to 0.250.
     *   @param [feedback] The amount of feedback in the
     *   delay line between 0 and 1. Defaults to 0.2.
     */
    constructor(delayTime?: number, feedback?: number)

    /**
     *   Set the delay time in seconds.
     *   @param delayTime The delay time in seconds.
     *   @param [rampTime] The time in seconds it takes to
     *   ramp to the new delay time. By default it is 0.1
     *   seconds. Setting it to 0 will change the delay
     *   time immediately and demonstrate legacy behavior.
     */
    delayTime(delayTime: number, rampTime?: number): void

    /**
     *   The amount of feedback in the delay line.
     *   @param feedbackAmount A number between 0 and 0.99.
     */
    feedback(feedbackAmount: number): void

    /**
     *   Process an input signal with a delay effect.
     *   @param unit A p5.sound source such as an
     *   Oscillator, Soundfile, or AudioIn object.
     *   @param delayTime The amount of delay in seconds. A
     *   number between 0 and 1.
     *   @param feedback The amount of feedback. A number
     *   between 0 and 1.
     */
    process(unit: object, delayTime: number, feedback: number): void

    /**
     *   Adjust the amplitude of the delay effect.
     *   @param amplitudeAmount An amplitude value between
     *   0 and 1.
     */
    amp(amplitudeAmount: number): void
  }
}
