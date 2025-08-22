import type { ActionRegister } from '@context-action/core';
import type { CacheActions, CacheResult } from '../scenarios/types';

export interface CacheHandlerDependencies {
  setExecutionPath: React.Dispatch<React.SetStateAction<string[]>>;
  setHandlerExecutions: React.Dispatch<React.SetStateAction<number>>;
  memoryCache: Map<string, any>;
  redisCache: Map<string, any>;
}

export function setupCacheHandlers(
  register: ActionRegister<CacheActions>,
  deps: CacheHandlerDependencies
) {
  const { setExecutionPath, setHandlerExecutions, memoryCache, redisCache } = deps;

  // Memory cache check (priority 100)
  const unregisterMemory = register.register<'fetchData', CacheResult>('fetchData', async (payload, controller) => {
    console.log(`🔍 Checking memory cache for key: ${payload.key}`);
    setExecutionPath(prev => [...prev, 'memory-cache-check']);
    setHandlerExecutions(prev => prev + 1);
    
    const cached = memoryCache.get(payload.key);
    
    if (cached && !payload.bustCache) {
      console.log('✅ Memory cache hit! Returning early.');
      setExecutionPath(prev => [...prev, 'memory-cache-hit']);
      controller.return({ 
        source: 'memory-cache', 
        data: cached, 
        timestamp: Date.now() 
      });
      return;
    }
    
    console.log('❌ Memory cache miss, continuing...');
    setExecutionPath(prev => [...prev, 'memory-cache-miss']);
  }, { priority: 100, id: 'memory-cache' });

  // Redis cache check (priority 80)
  const unregisterRedis = register.register<'fetchData', CacheResult>('fetchData', async (payload, controller) => {
    console.log(`🔍 Checking Redis cache for key: ${payload.key}`);
    setExecutionPath(prev => [...prev, 'redis-cache-check']);
    setHandlerExecutions(prev => prev + 1);
    
    const cached = redisCache.get(payload.key);
    
    if (cached && !payload.bustCache) {
      console.log('✅ Redis cache hit! Returning early.');
      setExecutionPath(prev => [...prev, 'redis-cache-hit']);
      // Store in memory cache for next time
      memoryCache.set(payload.key, cached);
      controller.return({ 
        source: 'redis-cache', 
        data: cached, 
        timestamp: Date.now() 
      });
      return;
    }
    
    console.log('❌ Redis cache miss, continuing to database...');
    setExecutionPath(prev => [...prev, 'redis-cache-miss']);
  }, { priority: 80, id: 'redis-cache' });

  // Database fetch (priority 60)
  const unregisterDatabase = register.register<'fetchData', CacheResult>('fetchData', async (payload, controller) => {
    console.log(`🌐 Fetching from database: ${payload.key}`);
    setExecutionPath(prev => [...prev, 'database-fetch']);
    setHandlerExecutions(prev => prev + 1);
    
    // Simulate database fetch
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const dbData = { id: payload.key, name: `User ${payload.key}`, fetched: Date.now() };
    
    // Cache the result
    redisCache.set(payload.key, dbData);
    memoryCache.set(payload.key, dbData);
    
    return { 
      source: 'database', 
      data: dbData, 
      timestamp: Date.now() 
    };
  }, { priority: 60, id: 'database-fetch' });

  // Cleanup function
  return () => {
    unregisterMemory();
    unregisterRedis();
    unregisterDatabase();
  };
}