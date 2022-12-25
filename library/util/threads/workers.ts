import paper from "paper";
import {
  expose as exposeImpl,
  spawn as spawnImpl,
  Transfer as TransferImpl,
  TransferDescriptor as TransferDescriptorImpl,
} from "threads";
import { WorkerFunction, WorkerModule } from "threads/dist/types/worker";
import { isWorkerRuntime } from "threads/dist/worker";
import { CompoundPathSerializer } from "../../geometry/paper";
import { registerSerializer, SingleSerializable, TypedSerializer } from "./serializers";

type WorkerScope = WorkerFunction | WorkerModule<string>;

export type TransferDescriptor<T extends Transferable> = TransferDescriptorImpl<T>;
export function Transfer<T extends Transferable>(payload: T): TransferDescriptor<T> {
  return TransferImpl(payload) as TransferDescriptor<T>;
}

type BaseSerializer = TypedSerializer<SingleSerializable, unknown>;
const serializerTypesSet = new Set<string>();
const tryRegisterSerializer = (serializer: BaseSerializer) => {
  if (serializerTypesSet.has(serializer.type)) {
    console.warn(`Serializer for type "${serializer.type} already registered"`);
  } else {
    registerSerializer(serializer);
    serializerTypesSet.add(serializer.type);
  }
};

export async function spawn<Exposed extends WorkerScope>(workerUrl: URL, serializers: BaseSerializer[]) {
  [CompoundPathSerializer, ...serializers].forEach(tryRegisterSerializer);
  return await spawnImpl<Exposed>(new Worker(workerUrl, { type: "module" }));
}

export function expose(exposed: WorkerScope, serializers: BaseSerializer[]): void {
  if (isWorkerRuntime()) {
    paper.setup("");
    [CompoundPathSerializer, ...serializers].forEach(tryRegisterSerializer);
    exposeImpl(exposed);
  }
}
