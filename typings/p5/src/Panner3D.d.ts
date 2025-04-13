// This file was auto-generated. Please do not edit it.

import * as p5 from "../index"

declare module "../index" {
  class Panner3D {
    /**
     *   A 3D sound spatializer.
     *
     */
    constructor()

    /**
     *   Connects an input source to the 3D panner.
     *   @param input an input source to process with the
     *   3D panner.
     */
    process(input: object): void

    /**
     *   Set the x, y, and z position of the 3D panner.
     *   @param xPosition the x coordinate of the panner.
     *   @param yPosition the y coordinate of the panner.
     *   @param zPosition the z coordinate of the panner.
     */
    set(xPosition: number, yPosition: number, zPosition: number): void

    /**
     *   The rolloff rate of the panner.
     */
    setFalloff(rolloffFactor: number, maxDistance: number): void

    /**
     *   Set the maximum distance of the panner.
     *   @param distance the maximum distance that the
     *   sound source can be heard from.
     */
    maxDist(distance: number): void

    /**
     *   Set the rolloff rate of the panner.
     *   @param r the rolloff rate of the panner.
     */
    rolloff(r: number): void

    /**
     *   Set the X position of the sound source.
     *   @param positionX the x position of the sound
     *   source.
     */
    positionX(positionX: number): void

    /**
     *   Set the Y position of the sound source.
     *   @param positionY the y position of the sound
     *   source.
     */
    positionY(positionY: number): void

    /**
     *   Set the Z position of the sound source.
     *   @param positionZ the z position of the sound
     *   source.
     */
    positionZ(positionZ: number): void
  }
}
