export type WorkerStatus = 'idle' | 'running' | 'done' | 'error';

export interface WorkerState<TResult> {
  status: WorkerStatus;
  result: TResult | null;
  error: Error | null;
}

export interface WorkerOptions {
  suspense?: boolean;
  transferable?: boolean;
}

export interface WorkerMessage<TResult> {
  type: 'result' | 'error';
  data?: TResult;
  error?: string;
}

export type WorkerFunction<TArgs, TResult> = (args: TArgs) => TResult | Promise<TResult>;

export interface UseWorkerReturn<TArgs, TResult> {
  run: (args: TArgs) => void;
  cancel: () => void;
  result: TResult | null;
  status: WorkerStatus;
  error: Error | null;
}
