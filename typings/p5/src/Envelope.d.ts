// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class Envelope {
    /**
     *   Generate an amplitude envelope.
     *
     *   @param [attack] how quickly the envelope reaches
     *   the maximum level
     *   @param [decay] how quickly the envelope reaches
     *   the sustain level
     *   @param [sustain] how long the envelope stays at
     *   the decay level
     *   @param [release] how quickly the envelope fades
     *   out after the sustain level
     */
    constructor(attack?: number, decay?: number, sustain?: number, release?: number)

    /**
     *   Trigger the envelope and release it after the
     *   sustain time.
     */
    play(): void

    /**
     *   Trigger the Attack, and Decay portion of the
     *   Envelope. Similar to holding down a key on a
     *   piano, but it will hold the sustain level until
     *   you let go.
     */
    triggerAttack(): void

    /**
     *   Trigger the Release of the envelope. Similar to
     *   releasing the key on a piano and letting the sound
     *   fade according to the release level and release
     *   time.
     */
    triggerRelease(): void
    setInput(unit: object): void

    /**
     *   Sets the attack, decay, sustain, and release times
     *   of the envelope.
     *   @param attack how quickly the envelope reaches the
     *   maximum level
     *   @param decay how quickly the envelope reaches the
     *   sustain level
     *   @param sustain how long the envelope stays at the
     *   decay level
     *   @param release how quickly the envelope fades out
     *   after the sustain level
     */
    setADSR(attack: number, decay: number, sustain: number, release: number): void

    /**
     *   Sets the release time of the envelope.
     *   @param releaseTime the release time in seconds
     */
    releaseTime(releaseTime: number): void

    /**
     *   Sets the attack time of the envelope.
     *   @param attackTime the attack time in seconds
     */
    attackTime(attackTime: number): void
  }
}
