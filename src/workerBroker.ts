import { WorkerFunction, WorkerMessage } from './types';

export class WorkerBroker<TArgs, TResult> {
  private worker: Worker | null = null;
  private workerCode: string;

  constructor(fn: WorkerFunction<TArgs, TResult>) {
    // Convert the function to a string while preserving its name
    const fnString = fn.toString();
    
    this.workerCode = `
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
  }

  createWorker(): Worker {
    const blob = new Blob([this.workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    this.worker = new Worker(url);
    URL.revokeObjectURL(url); // Clean up the URL
    return this.worker;
  }

  run(args: TArgs, transferables?: Transferable[]): void {
    if (!this.worker) {
      this.worker = this.createWorker();
    }
    
    if (transferables) {
      this.worker.postMessage(args, transferables);
    } else {
      this.worker.postMessage(args);
    }
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
