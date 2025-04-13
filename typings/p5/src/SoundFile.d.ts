// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class SoundFile {
    /**
     *   Load and play sound files.
     *
     */
    constructor()

    /**
     *   Start the soundfile.
     */
    start(): void

    /**
     *   Start the soundfile.
     */
    play(): void

    /**
     *   Stop the soundfile.
     */
    stop(): void

    /**
     *   Pause the soundfile.
     */
    pause(): void

    /**
     *   Loop the soundfile.
     *   @param loopState Set to True or False in order to
     *   set the loop state.
     */
    loop(loopState: boolean): void

    /**
     *   Set a loop region, and optionally a playback rate,
     *   and amplitude for the soundfile.
     *   @param [startTime] Set to True or False in order
     *   to set the loop state.
     *   @param [rate] Set to True or False in order to set
     *   the loop state.
     *   @param [amp] Set to True or False in order to set
     *   the loop state.
     *   @param [duration] Set to True or False in order to
     *   set the loop state.
     */
    setLoop(startTime?: number, rate?: number, amp?: number, duration?: number): void

    /**
     *   Adjust the amplitude of the soundfile.
     *   @param amplitude amplitude value between 0 and 1.
     */
    amp(amplitude: number): void

    /**
     *   Change the path for the soundfile.
     *   @param path Path to the sound file.
     *   @param [successCallback] Function to call when the
     *   sound file is loaded.
     */
    setPath(path: string, successCallback?: (...args: any[]) => any): void

    /**
     *   Set the playback rate of the soundfile.
     *   @param rate 1 is normal speed, 2 is double speed.
     *   Negative values plays the soundfile backwards.
     */
    rate(rate: number): void

    /**
     *   Returns the duration of a sound file in seconds.
     *   @return duration
     */
    duration(): number

    /**
     *   Return the sample rate of the sound file.
     *   @return sampleRate
     */
    sampleRate(): number

    /**
     *   Move the playhead of a soundfile that is currently
     *   playing to a new position.
     *   @param timePoint Time to jump to in seconds.
     */
    jump(timePoint: number): void

    /**
     *   Return the playback state of the soundfile.
     *   @return Playback state, true or false.
     */
    isPlaying(): boolean

    /**
     *   Return the playback state of the soundfile.
     *   @return Looping State, true or false.
     */
    isLooping(): boolean

    /**
     *   Define a function to call when the soundfile is
     *   done playing.
     *   @param callback Name of a function that will be
     *   called when the soundfile is done playing.
     */
    onended(callback: (...args: any[]) => any): void

    /**
     *   Return the number of samples in a sound file.
     *   @return The number of samples in the sound file.
     */
    frames(): number

    // TODO: Fix sampleRate() errors in src/SoundFile.js, line 428:
    //
    //    return has invalid type: undefined
    //
    // sampleRate(): undefined

    // TODO: Fix channels() errors in src/SoundFile.js, line 438:
    //
    //    return has invalid type: undefined
    //
    // channels(): undefined
  }
}
