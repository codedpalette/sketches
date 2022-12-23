import { spawn } from "threads";
import { Thread } from "threads/dist/master/thread";
import { WorkerFunction, WorkerModule } from "threads/dist/types/worker";

async function spawnWorker<T extends WorkerFunction | WorkerModule<string>>(
  workerPath: string,
  metaUrl: string //TODO: Fix
): Promise<T & Thread> {
  const workerUrl = new URL(workerPath, metaUrl);
  return (await spawn<T>(new Worker(workerUrl, { type: "module" }))) as unknown as T & Thread;
}

export { spawnWorker };
