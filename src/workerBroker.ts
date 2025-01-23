import { WorkerFunction, WorkerMessage } from './types';

export class WorkerBroker<TArgs, TResult> {
  private worker: Worker | null = null;
  private workerCode: string;

  constructor(fn: WorkerFunction<TArgs, TResult>) {
    const fnString = fn.toString();
    console.log('Creating worker with function:', fnString);
    
    this.workerCode = `
      self.onmessage = async (e) => {
        try {
          console.log('Worker received message:', e.data);
          const fn = ${fnString};
          const result = await fn(e.data);
          console.log('Worker computed result:', result);
          self.postMessage({ type: 'result', data: result });
        } catch (error) {
          console.log('Worker error:', error);
          self.postMessage({ type: 'error', error: error.message });
        }
      };
    `;
  }

  createWorker(): Worker {
    console.log('Creating new worker');
    const blob = new Blob([this.workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    this.worker = new Worker(url);
    URL.revokeObjectURL(url);
    return this.worker;
  }

  run(args: TArgs, transferables?: Transferable[]): void {
    console.log('Running worker with args:', args);
    if (!this.worker) {
      this.worker = this.createWorker();
    }
    
    if (transferables && transferables.length > 0) {
      console.log('Transferring with transferables:', transferables);
      this.worker.postMessage(args, transferables);
    } else {
      this.worker.postMessage(args);
    }
  }

  terminate(): void {
    if (this.worker) {
      console.log('Terminating worker');
      this.worker.terminate();
      this.worker = null;
    }
  }

  getWorker(): Worker {
    if (!this.worker) {
      this.worker = this.createWorker();
    }
    return this.worker;
  }
}
