import { useStoreValue } from '@context-action/react';
import { useCallback } from 'react';
import {
  useCacheActionHandler,
  useFlowControlStore,
} from '../contexts/FlowControlContexts';

// import type { CacheResult } from '../scenarios/types';

interface CacheHandlerProps {
  onExecutionStep: (step: string) => void;
  onHandlerExecution: () => void;
}

export function CacheHandlers({
  onExecutionStep,
  onHandlerExecution,
}: CacheHandlerProps) {
  const cacheStore = useFlowControlStore('cache');
  const cache = useStoreValue(cacheStore);

  // Memory Cache Handler (P:100) - Highest priority cache
  const memoryCacheHandler = useCallback(
    async (payload: any, controller: any): Promise<void> => {
      onExecutionStep('🧠 Memory Cache Check (P:100)');
      onHandlerExecution();

      console.log('🧠 Checking memory cache for:', payload.key);

      // Simulate cache lookup delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check if cache should be busted
      if (payload.bustCache) {
        console.log('💥 Cache bust requested, clearing memory cache');

        // Use store.update() to modify cache following Context-Action conventions
        cacheStore.update((currentCache) => {
          currentCache.memoryCache.delete(payload.key);
          return currentCache;
        });

        onExecutionStep('💥 Cache Busted - Skip Memory Cache');
        return; // Continue to next handler
      }

      // Check memory cache
      const cachedData = cache.memoryCache.get(payload.key);
      if (cachedData) {
        console.log('🎯 Memory cache HIT - Early return');
        onExecutionStep('🎯 Memory Cache HIT - Early Return');

        // Early return - stop pipeline execution completely
        controller.return({
          source: 'memory-cache' as const,
          data: cachedData,
          timestamp: Date.now(),
        });
        return;
      }

      console.log('❌ Memory cache MISS');
      onExecutionStep('❌ Memory Cache MISS - Continue');
      return; // Continue to next handler
    },
    [onExecutionStep, onHandlerExecution, cache.memoryCache]
  );

  // Redis Cache Handler (P:80) - Second priority cache
  const redisCacheHandler = useCallback(
    async (payload: any, controller: any): Promise<void> => {
      onExecutionStep('🔴 Redis Cache Check (P:80)');
      onHandlerExecution();

      console.log('🔴 Checking Redis cache for:', payload.key);

      // Simulate network cache lookup delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      const cachedData = cache.redisCache.get(payload.key);
      if (cachedData) {
        console.log('🎯 Redis cache HIT - Populate memory cache and return');
        onExecutionStep('🎯 Redis Cache HIT - Early Return');

        // Populate memory cache for next time using store.update()
        cacheStore.update((currentCache) => {
          currentCache.memoryCache.set(payload.key, cachedData);
          return currentCache;
        });

        // Early return - stop pipeline execution completely
        controller.return({
          source: 'redis-cache' as const,
          data: cachedData,
          timestamp: Date.now(),
        });
        return;
      }

      console.log('❌ Redis cache MISS');
      onExecutionStep('❌ Redis Cache MISS - Continue');
      return; // Continue to database handler
    },
    [onExecutionStep, onHandlerExecution, cache.memoryCache, cache.redisCache]
  );

  // Database Handler (P:60) - Fallback to database
  const databaseHandler = useCallback(
    async (payload: any, controller: any): Promise<void> => {
      onExecutionStep('🗄️ Database Fetch (P:60)');
      onHandlerExecution();

      console.log(
        '🗄️ Fetching from database:',
        payload.fallbackUrl || payload.key
      );

      // Simulate database fetch delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generate mock data
      const freshData = {
        id: payload.key,
        data: `Fresh data for ${payload.key}`,
        fetchedAt: new Date().toISOString(),
      };

      console.log('✅ Database fetch successful - Populating caches');
      onExecutionStep('✅ Database Fetch Complete - Populating Caches');

      // Populate both cache levels using store.update()
      cacheStore.update((currentCache) => {
        currentCache.memoryCache.set(payload.key, freshData);
        currentCache.redisCache.set(payload.key, freshData);
        return currentCache;
      });

      controller.return({
        source: 'database' as const,
        data: freshData,
        timestamp: Date.now(),
      });
    },
    [onExecutionStep, onHandlerExecution, cache.memoryCache, cache.redisCache]
  );

  // Register handlers with priorities (higher numbers execute first)
  // Use blocking: true to enable proper early return with controller.return()
  useCacheActionHandler('fetchData', memoryCacheHandler, {
    priority: 100,
    blocking: true,
  });
  useCacheActionHandler('fetchData', redisCacheHandler, {
    priority: 80,
    blocking: true,
  });
  useCacheActionHandler('fetchData', databaseHandler, {
    priority: 60,
    blocking: true,
  });

  return null;
}
