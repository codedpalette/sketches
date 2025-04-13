// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class Reverb {
    /**
     *   Add reverb to a sound.
     *
     *   @param [decayTime] Set the decay time of the
     *   reverb
     */
    constructor(decayTime?: number)

    /**
     *   Set the decay time of the reverb.
     *   @param time Decay time of the reverb in seconds.
     */
    set(time: number): void

    /**
     *   Adjust the dry/wet value.
     *   @param mix The desired mix between the original
     *   and the affected signal. A number between 0 and 1.
     *   0 is all dry, 1 is completely affected.
     */
    drywet(mix: number): void
  }
}
