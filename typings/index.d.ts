declare module "threads/dist-esm/worker" {
  import { WorkerFunction, WorkerModule } from "threads/dist/types/worker";
  export function expose(exposed: WorkerFunction | WorkerModule<string>): void;
}
