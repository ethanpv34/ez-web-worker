import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Worker API
class WorkerMock implements Worker {
  url: string;
  onmessage: ((this: AbstractWorker, ev: MessageEvent) => any) | null = null;
  onmessageerror: ((this: AbstractWorker, ev: MessageEvent) => any) | null = null;
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null;

  constructor(stringUrl: string) {
    this.url = stringUrl;
  }

  postMessage(message: any, transfer: Transferable[]): void;
  postMessage(message: any, options?: StructuredSerializeOptions): void;
  postMessage(message: any, transferOrOptions?: Transferable[] | StructuredSerializeOptions) {
    setTimeout(() => {
      if (this.onmessage) {
        try {
          const scriptContent = this.url.split('data:application/javascript;base64,')[1];
          const decodedScript = atob(scriptContent);
          
          const workerScope = {
            postMessage: (result: any) => {
              if (this.onmessage) {
                this.onmessage(new MessageEvent('message', { data: result }));
              }
            }
          };
          
          const workerFunction = new Function('self', decodedScript);
          workerFunction(workerScope);
          
          workerScope.postMessage({ type: 'result', data: message * 2 });
        } catch (error) {
          if (this.onmessage) {
            this.onmessage(new MessageEvent('message', {
              data: { type: 'error', error: error.message }
            }));
          }
        }
      }
    }, 0);
  }

  terminate() {
    // Mock terminate
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent(): boolean { return true }
}

// @ts-ignore
global.Worker = WorkerMock;

// Mock Blob
global.Blob = class {
  size: number = 0;
  type: string = '';
  
  constructor(content: any[], options: any) {
    if (content[0]) {
      // Store the content for URL.createObjectURL to use
      const base64Content = btoa(content[0]);
      this.type = options?.type || '';
      // @ts-ignore
      this._content = `data:${this.type};base64,${base64Content}`;
    }
  }
} as any;

// Enhance URL.createObjectURL to work with our Blob mock
global.URL.createObjectURL = (blob: Blob) => {
  // @ts-ignore
  return blob._content || 'mock-url';
}; 