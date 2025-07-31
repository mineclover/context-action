import { useEffect } from 'react';
import type { IStore } from '../types';

/**
 * Sync two stores - when source changes, update target
 * @param source The source store
 * @param target The target store
 * @param transform Optional transform function
 */
export function useStoreSync<S, T>(
  source: IStore<S>,
  target: IStore<T>,
  transform?: (value: S) => T
) {
  useEffect(() => {
    const sync = () => {
      const sourceValue = source.getValue();
      const targetValue = transform ? transform(sourceValue) : sourceValue as any;
      
      if ('setValue' in target && typeof target.setValue === 'function') {
        target.setValue(targetValue);
      }
    };

    // Initial sync
    sync();

    // Subscribe to changes
    return source.subscribe(sync);
  }, [source, target, transform]);
}