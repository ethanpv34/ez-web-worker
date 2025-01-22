# ez-web-worker

A lightweight, type-safe React hook for seamlessly integrating Web Workers into your React applications. Run expensive computations off the main thread without managing worker files or dealing with complex worker setup.

## Features

- 🚀 Simple API with a single hook
- 📦 No separate worker files needed
- 💪 Full TypeScript support
- 🔄 Automatic worker lifecycle management
- ⚡ Support for transferable objects
- ⚛️ Optional React Suspense integration
- 🛑 Built-in cancellation support

## Installation

```bash
npm install ez-web-worker
```

## Basic Usage

```typescript
import { useWorker } from 'ez-web-worker';

function MyComponent() {
  const { run, cancel, result, status, error } = useWorker((input: number) => {
    // This code runs in a Web Worker
    let total = 0;
    for (let i = 0; i < 1e8; i++) {
      total += (i * input) % 1234567;
    }
    return total;
  });

  return (
    <div>
      <button onClick={() => run(42)}>Start Calculation</button>
      <button onClick={cancel}>Cancel</button>
      {status === 'running' && <p>Calculating...</p>}
      {status === 'done' && <p>Result: {result}</p>}
      {status === 'error' && <p>Error: {error?.message}</p>}
    </div>
  );
}
```

## API Reference

```typescript
useWorker<TArgs, TResult>(workerFn: (args: TArgs) => TResult | Promise<TResult>, options?: WorkerOptions): UseWorkerReturn<TArgs, TResult>
```

#### Parameters

- `workerFn`: The function to run in the Web Worker. Must be self-contained (no closure variables).
- `options`: Optional configuration object
  - `suspense?: boolean`: Enable React Suspense integration
  - `transferable?: boolean`: Enable automatic transferable object handling

#### Returns

- `run: (args: TArgs) => void`: Execute the worker function
- `cancel: () => void`: Cancel the current execution
- `result: TResult | null`: The result of the computation
- `status: 'idle' | 'running' | 'done' | 'error'`: Current worker status
- `error: Error | null`: Error object if the computation failed

## Advanced Usage

### With Transferable Objects

```typescript
function ProcessImageData() {
  const { run, result } = useWorker(
    (imageData: ArrayBuffer) => {
      // Process image data in worker
      return processedData;
    },
    { transferable: true }
  );

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => run(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  };

  return <input type="file" onChange={handleImageUpload} />;
}
```

### With Suspense

```typescript
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ExpensiveComponent />
    </Suspense>
  );
}

function ExpensiveComponent() {
  const { run, result } = useWorker(
    expensiveFunction,
    { suspense: true }
  );
  
  // Component will suspend while worker is running
  return <div>{result}</div>;
}
```

## Limitations

- Worker functions must be self-contained and cannot reference variables from their outer scope
- DOM APIs are not available inside worker functions
- Limited SSR support (workers only run in browser environment)

## License

MIT © [ethanpv34](https://github.com/ethanpv34) 
