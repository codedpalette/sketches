declare module "rbush-knn" {
  import type RBush from "rbush"

  /**
   * k-nearest neighbors search for {@link RBush}
   * @param tree an {@link RBush} tree
   * @param x query coordinate
   * @param y query coordinate
   * @param [k] number of neighbors to search for (Infinity by default)
   * @param [filterFn] optional filter function; k nearest items where filterFn(item) === true will be returned
   * @param [maxDistance] optional maximum distance between neighbors and the query coordinates (Infinity by default)
   */
  function knn<T>(
    tree: RBush<T>,
    x: number,
    y: number,
    k = Infinity,
    filterFn?: (item: T) => boolean,
    maxDistance = Infinity
  ): T[]

  export default knn
}
