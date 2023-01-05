declare namespace paper {
  interface Point {
    toVec(): [number, number];
  }

  interface Path {
    toPoints(step = 1): Point[];
  }

  interface CompoundPath {
    childPaths(): Path[];
    toPoints(step = 1): Point[];
  }

  interface Rectangle {
    toPath(): Path;
  }
}
