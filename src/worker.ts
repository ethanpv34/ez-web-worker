export type WorkerFunction<TArgs, TResult> = (args: TArgs) => TResult | Promise<TResult>;

export function createWorker<TArgs, TResult>(
  fn: WorkerFunction<TArgs, TResult>,
  options: { transferable?: boolean } = {}
) {
  const fnString = fn.toString();
  const workerCode = `
    self.onmessage = async (e) => {
      try {
        const fn = ${fnString};
        const result = await fn(e.data);
        self.postMessage({ type: 'result', data: result });
      } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
      }
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url);

  return {
    run: (args: TArgs, transferables?: Transferable[]): Promise<TResult> => {
      return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
          const { type, data, error } = e.data;
          if (type === 'result') {
            resolve(data as TResult);
          } else if (type === 'error') {
            reject(new Error(error));
          }
        };

        worker.onerror = (error) => {
          reject(new Error(error.message));
        };

        if (options.transferable && transferables) {
          worker.postMessage(args, transferables);
        } else {
          worker.postMessage(args);
        }
      });
    },
    terminate: () => worker.terminate()
  };
} 