import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Worker API
class WorkerMock implements Worker {
  // Implement required Worker interface properties
  onmessage: ((this: AbstractWorker, ev: MessageEvent) => any) | null = null;
  onmessageerror: ((this: AbstractWorker, ev: MessageEvent) => any) | null = null;
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null;

  postMessage(message: any, transfer: Transferable[]): void;
  postMessage(message: any, options?: StructuredSerializeOptions): void;
  postMessage(message: any, transferOrOptions?: Transferable[] | StructuredSerializeOptions) {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', {
          data: { type: 'result', data: message * 2 }
        }));
      }
    }, 50);
  }

  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent(): boolean { return true }
}

// @ts-ignore
global.Worker = WorkerMock; 