import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkerBroker } from './workerBroker';
import {
  WorkerFunction,
  WorkerMessage,
  WorkerOptions,
  WorkerState,
  UseWorkerReturn
} from './types';

export function useWorker<TArgs, TResult>(
  workerFn: WorkerFunction<TArgs, TResult>,
  options: WorkerOptions = {}
): UseWorkerReturn<TArgs, TResult> {
  const [state, setState] = useState<WorkerState<TResult>>({
    status: 'idle',
    result: null,
    error: null,
  });

  const brokerRef = useRef<WorkerBroker<TArgs, TResult> | null>(null);

  // Initialize the worker broker
  useEffect(() => {
    brokerRef.current = new WorkerBroker<TArgs, TResult>(workerFn);
    
    return () => {
      brokerRef.current?.terminate();
    };
  }, [workerFn]);

  const run = useCallback((args: TArgs) => {
    if (!brokerRef.current) return;

    setState(prev => ({ ...prev, status: 'running', error: null }));
    
    const worker = brokerRef.current.createWorker();
    
    worker.onmessage = (e: MessageEvent<WorkerMessage<TResult>>) => {
      const { type, data, error } = e.data;
      
      if (type === 'result') {
        setState({
          status: 'done',
          result: data as TResult,
          error: null,
        });
      } else if (type === 'error') {
        setState({
          status: 'error',
          result: null,
          error: new Error(error),
        });
      }
    };

    worker.onerror = (error) => {
      setState({
        status: 'error',
        result: null,
        error: new Error(error.message),
      });
    };

    brokerRef.current.run(args);
  }, []);

  const cancel = useCallback(() => {
    brokerRef.current?.terminate();
    setState({
      status: 'idle',
      result: null,
      error: null,
    });
  }, []);

  // Handle Suspense integration
  if (options.suspense && state.status === 'running') {
    throw new Promise((resolve) => {
      const worker = brokerRef.current?.createWorker();
      if (worker) {
        worker.onmessage = resolve;
      }
    });
  }

  return {
    run,
    cancel,
    result: state.result,
    status: state.status,
    error: state.error,
  };
}
