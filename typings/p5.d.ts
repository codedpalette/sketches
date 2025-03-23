import p5 from "p5"

declare module "p5" {
  // eslint-disable-next-line jsdoc/require-jsdoc
  interface p5InstanceExtensions {
    /**
     * Generates a random color. Sets colorMode(RGB, 1)
     */
    randomColor(): p5.Color
  }
}
