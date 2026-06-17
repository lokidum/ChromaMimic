/* Thin wrapper around the LUT worker. Returns a cancellable build so a new
   build (e.g. a live grade tweak) can supersede an in-flight one. */
import type { BuildRequest, BuildResponse } from "../workers/lut.worker";

export type BuildHandle = {
  promise: Promise<{ lut: Float32Array; size: number }>;
  cancel: () => void;
};

export function startBuild(
  params: BuildRequest,
  onProgress?: (p: number) => void,
): BuildHandle {
  const worker = new Worker(new URL("../workers/lut.worker.ts", import.meta.url), {
    type: "module",
  });
  let settled = false;
  const promise = new Promise<{ lut: Float32Array; size: number }>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<BuildResponse>) => {
      const m = e.data;
      if (m.type === "progress") {
        onProgress?.(m.value);
      } else if (m.type === "done") {
        settled = true;
        resolve({ lut: new Float32Array(m.lut), size: m.size });
        worker.terminate();
      } else {
        settled = true;
        reject(new Error(m.message));
        worker.terminate();
      }
    };
    worker.onerror = (e) => {
      settled = true;
      reject(new Error(e.message || "LUT worker failed"));
      worker.terminate();
    };
    // transfer the (freshly sampled) pixel buffers — zero-copy
    worker.postMessage(params, [params.srcPx.buffer, params.refPx.buffer]);
  });
  return {
    promise,
    cancel: () => {
      if (!settled) worker.terminate();
    },
  };
}
