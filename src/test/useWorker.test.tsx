import { renderHook, act } from '@testing-library/react-hooks';
import { describe, it, expect } from 'vitest';
import { useWorker } from '../useWorker';

describe('useWorker', () => {
  it('should initialize with idle status', () => {
    const { result } = renderHook(() => 
      useWorker((x: number) => x * 2)
    );

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should handle successful computation', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useWorker((x: number) => x * 2)
    );

    act(() => {
      result.current.run(21);
    });

    expect(result.current.status).toBe('running');
    
    await waitForNextUpdate();

    expect(result.current.status).toBe('done');
    expect(result.current.result).toBe(42);
    expect(result.current.error).toBe(null);
  });

  it('should handle cancellation', () => {
    const { result } = renderHook(() => 
      useWorker((x: number) => x * 2)
    );

    act(() => {
      result.current.run(21);
      result.current.cancel();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBe(null);
  });

  it('should handle errors', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useWorker(() => {
        throw new Error('Test error');
      })
    );

    act(() => {
      result.current.run(null);
    });

    await waitForNextUpdate();

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeTruthy();
  });
}); 