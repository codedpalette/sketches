declare module "threads" {
  export { registerSerializer } from "threads/dist/common";
  export * from "threads/dist/master/index";
  export { DefaultSerializer, JsonSerializable, Serializer, SerializerImplementation } from "threads/dist/serializers";
  export { expose } from "threads/dist/worker/index";

  import { $transferable } from "threads/dist/symbols";
  export interface TransferDescriptor<T extends Transferable> {
    [$transferable]: true;
    send: T;
    transferables: Transferable[];
  }
  export function Transfer<T extends Transferable>(payload: T): TransferDescriptor<T>;
}
