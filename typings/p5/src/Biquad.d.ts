// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class Biquad {
    /**
     *   Filter the frequency range of a sound.
     *
     *   @param [cutoff] cutoff frequency of the filter, a
     *   value between 0 and 24000.
     *   @param [type] filter type. Options: "lowpass",
     *   "highpass", "bandpass", "lowshelf", "highshelf",
     *   "notch", "allpass", "peaking"
     */
    constructor(cutoff?: number, type?: string)

    /**
     *   The filter's resonance factor.
     *   @param resonance resonance of the filter. A number
     *   between 0 and 100.
     */
    res(resonance: number): void

    /**
     *   The gain of the filter in dB units.
     *   @param gain gain value in dB units. The gain is
     *   only used for lowshelf, highshelf, and peaking
     *   filters.
     */
    gain(gain: number): void

    /**
     *   Set the type of the filter.
     *   @param type type of the filter. Options:
     *   "lowpass", "highpass", "bandpass", "lowshelf",
     *   "highshelf", "notch", "allpass", "peaking"
     */
    setType(type: string): void

    /**
     *   Set the cutoff frequency of the filter.
     *   @param cutoffFrequency the cutoff frequency of the
     *   filter.
     */
    freq(cutoffFrequency: number): void
  }
  class LowPass extends Biquad {
    /**
     *   Creates a Lowpass Biquad filter.
     *
     *   @param [freq] Set the cutoff frequency of the
     *   filter
     */
    constructor(freq?: number)
  }
  class HighPass extends Biquad {
    /**
     *   Creates a Highpass Biquad filter.
     *
     *   @param [freq] Set the cutoff frequency of the
     *   filter
     */
    constructor(freq?: number)
  }
  class BandPass extends Biquad {
    /**
     *   Creates a Bandpass Biquad filter.
     *
     *   @param [freq] Set the cutoff frequency of the
     *   filter
     */
    constructor(freq?: number)
  }
}
