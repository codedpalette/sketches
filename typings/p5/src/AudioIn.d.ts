// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class AudioIn {
    /**
     *   Get sound from an input source, typically a
     *   computer microphone.
     *
     */
    constructor()

    /**
     *   Start the audio input.
     */
    start(): void

    /**
     *   Stop the audio input.
     */
    stop(): void

    /**
     *   Set amplitude (volume) of a mic input between 0
     *   and 1.0.
     *   @param amplitudeAmount An amplitude value between
     *   0 and 1.
     */
    amp(amplitudeAmount: number): void
  }
}
