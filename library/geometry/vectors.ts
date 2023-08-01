export type Vector2 = [number, number]
export type Vector2Like = Vector2 | { x: number; y: number }
export function toVector(vectorLike: Vector2Like): Vector2 {
  return vectorLike instanceof Array ? vectorLike : [vectorLike.x, vectorLike.y]
}
