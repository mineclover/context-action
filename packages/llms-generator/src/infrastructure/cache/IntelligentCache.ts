/**
 * Intelligent Caching System
 * 
 * 적응형 캐싱 전략과 성능 최적화
 */

export interface CacheEntry<T> {
  readonly value: T;
  readonly timestamp: Date;
  readonly accessCount: number;
  readonly lastAccessed: Date;
  readonly ttl?: number; // Time to live in milliseconds
  readonly size?: number; // Estimated size in bytes
}

export interface CacheStats {
  readonly hitCount: number;
  readonly missCount: number;
  readonly hitRate: number;
  readonly totalSize: number;
  readonly entryCount: number;
  readonly oldestEntry: Date | null;
  readonly newestEntry: Date | null;
}

export interface CacheConfig {
  readonly maxSize: number; // Maximum number of entries
  readonly maxMemory: number; // Maximum memory usage in MB
  readonly defaultTtl: number; // Default TTL in milliseconds
  readonly cleanupInterval: number; // Cleanup interval in milliseconds
  readonly evictionStrategy: 'lru' | 'lfu' | 'fifo' | 'adaptive';
}

/**
 * IntelligentCache
 * 
 * 고성능 적응형 캐시 시스템
 */
export class IntelligentCache<K = string, V = any> {
  private readonly cache = new Map<K, CacheEntry<V>>();
  private readonly accessOrder: K[] = []; // For LRU
  private readonly config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      maxMemory: 100, // 100MB
      defaultTtl: 3600000, // 1 hour
      cleanupInterval: 60000, // 1 minute
      evictionStrategy: 'adaptive',
      ...config
    };

    this.startCleanupTimer();
  }

  /**
   * 값 저장
   */
  set(key: K, value: V, ttl?: number): void {
    const now = new Date();
    const entry: CacheEntry<V> = {
      value,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
      ttl: ttl ?? this.config.defaultTtl,
      size: this.estimateSize(value)
    };

    // 기존 항목이 있으면 제거
    if (this.cache.has(key)) {
      this.remove(key);
    }

    // 캐시 크기 제한 확인
    this.ensureCapacity();

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  /**
   * 값 조회
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return undefined;
    }

    // TTL 확인
    if (this.isExpired(entry)) {
      this.remove(key);
      this.missCount++;
      return undefined;
    }

    // 접근 통계 업데이트
    const updatedEntry: CacheEntry<V> = {
      ...entry,
      accessCount: entry.accessCount + 1,
      lastAccessed: new Date()
    };

    this.cache.set(key, updatedEntry);
    this.updateAccessOrder(key);
    this.hitCount++;

    return entry.value;
  }

  /**
   * 조건부 조회 (존재하지 않으면 생성)
   */
  async getOrSet(key: K, factory: () => Promise<V> | V, ttl?: number): Promise<V> {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * 값 존재 여부 확인
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.remove(key);
      return false;
    }
    
    return true;
  }

  /**
   * 값 제거
   */
  remove(key: K): boolean {
    const removed = this.cache.delete(key);
    if (removed) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    return removed;
  }

  /**
   * 캐시 초기화
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 캐시 통계
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
    const timestamps = entries.map(entry => entry.timestamp);

    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      totalSize,
      entryCount: this.cache.size,
      oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : null,
      newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : null
    };
  }

  /**
   * 캐시 최적화
   */
  optimize(): {
    evictedCount: number;
    memoryFreed: number;
    recommendations: string[];
  } {
    const initialSize = this.cache.size;
    const initialMemory = this.getCurrentMemoryUsage();
    const recommendations: string[] = [];

    // 만료된 항목 제거
    this.cleanup();

    // 성능 분석 기반 최적화
    const stats = this.getStats();
    
    if (stats.hitRate < 0.5) {
      recommendations.push('캐시 적중률이 낮습니다. TTL 설정을 검토하세요.');
    }

    if (stats.totalSize > this.config.maxMemory * 1024 * 1024 * 0.8) {
      recommendations.push('메모리 사용량이 높습니다. 캐시 크기를 줄이거나 불필요한 데이터를 정리하세요.');
      this.evictLeastUseful();
    }

    const finalSize = this.cache.size;
    const finalMemory = this.getCurrentMemoryUsage();

    return {
      evictedCount: initialSize - finalSize,
      memoryFreed: initialMemory - finalMemory,
      recommendations
    };
  }

  /**
   * 캐시 내용을 JSON으로 직렬화
   */
  serialize(): string {
    const data = {
      config: this.config,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        value: entry.value,
        timestamp: entry.timestamp.toISOString(),
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed.toISOString(),
        ttl: entry.ttl,
        size: entry.size
      })),
      stats: this.getStats(),
      accessOrder: this.accessOrder
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * JSON에서 캐시 복원
   */
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      this.clear();
      
      for (const item of parsed.entries) {
        const entry: CacheEntry<V> = {
          value: item.value,
          timestamp: new Date(item.timestamp),
          accessCount: item.accessCount,
          lastAccessed: new Date(item.lastAccessed),
          ttl: item.ttl,
          size: item.size
        };
        
        if (!this.isExpired(entry)) {
          this.cache.set(item.key, entry);
        }
      }

      // 접근 순서 복원
      this.accessOrder.length = 0;
      this.accessOrder.push(...parsed.accessOrder.filter((key: K) => this.cache.has(key)));
      
    } catch (error) {
      console.warn('Failed to deserialize cache:', error);
    }
  }

  /**
   * 캐시 크기 보장
   */
  private ensureCapacity(): void {
    while (this.cache.size >= this.config.maxSize || this.getCurrentMemoryUsage() >= this.config.maxMemory * 1024 * 1024) {
      this.evictOne();
    }
  }

  /**
   * 항목 하나 제거 (전략에 따라)
   */
  private evictOne(): void {
    switch (this.config.evictionStrategy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'lfu':
        this.evictLFU();
        break;
      case 'fifo':
        this.evictFIFO();
        break;
      case 'adaptive':
        this.evictAdaptive();
        break;
    }
  }

  /**
   * LRU (Least Recently Used) 제거
   */
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const key = this.accessOrder[0];
      this.remove(key);
    }
  }

  /**
   * LFU (Least Frequently Used) 제거
   */
  private evictLFU(): void {
    let minAccess = Infinity;
    let keyToEvict: K | undefined;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < minAccess) {
        minAccess = entry.accessCount;
        keyToEvict = key;
      }
    }

    if (keyToEvict !== undefined) {
      this.remove(keyToEvict);
    }
  }

  /**
   * FIFO (First In, First Out) 제거
   */
  private evictFIFO(): void {
    let oldestTime = new Date();
    let keyToEvict: K | undefined;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        keyToEvict = key;
      }
    }

    if (keyToEvict !== undefined) {
      this.remove(keyToEvict);
    }
  }

  /**
   * 적응형 제거 (점수 기반)
   */
  private evictAdaptive(): void {
    let lowestScore = Infinity;
    let keyToEvict: K | undefined;

    const now = new Date().getTime();

    for (const [key, entry] of this.cache.entries()) {
      // 점수 계산: 접근 빈도, 최근성, 크기 고려
      const frequency = entry.accessCount;
      const recency = now - entry.lastAccessed.getTime();
      const size = entry.size || 1;
      
      // 낮을수록 제거 우선순위가 높음
      const score = (frequency * 1000) / (recency + 1) / size;

      if (score < lowestScore) {
        lowestScore = score;
        keyToEvict = key;
      }
    }

    if (keyToEvict !== undefined) {
      this.remove(keyToEvict);
    }
  }

  /**
   * 가장 유용하지 않은 항목들 제거
   */
  private evictLeastUseful(): void {
    const entries = Array.from(this.cache.entries());
    const now = new Date().getTime();

    // 유용성 점수로 정렬
    entries.sort(([, a], [, b]) => {
      const scoreA = (a.accessCount * 1000) / (now - a.lastAccessed.getTime() + 1) / (a.size || 1);
      const scoreB = (b.accessCount * 1000) / (now - b.lastAccessed.getTime() + 1) / (b.size || 1);
      return scoreA - scoreB;
    });

    // 하위 25% 제거
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.remove(entries[i][0]);
    }
  }

  /**
   * 접근 순서 업데이트
   */
  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * 만료 여부 확인
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    if (!entry.ttl) return false;
    return new Date().getTime() - entry.timestamp.getTime() > entry.ttl;
  }

  /**
   * 크기 추정
   */
  private estimateSize(value: V): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate
    } catch {
      return 100; // Default size
    }
  }

  /**
   * 현재 메모리 사용량 계산
   */
  private getCurrentMemoryUsage(): number {
    return Array.from(this.cache.values()).reduce((sum, entry) => sum + (entry.size || 0), 0);
  }

  /**
   * 정리 작업
   */
  private cleanup(): void {
    const now = new Date().getTime();
    const keysToRemove: K[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.remove(key));
  }

  /**
   * 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 정리 타이머 중지
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

/**
 * 전역 캐시 인스턴스들
 */
export const documentCache = new IntelligentCache<string, any>({
  maxSize: 500,
  maxMemory: 50,
  defaultTtl: 1800000, // 30 minutes
  evictionStrategy: 'adaptive'
});

export const configCache = new IntelligentCache<string, any>({
  maxSize: 100,
  maxMemory: 10,
  defaultTtl: 3600000, // 1 hour
  evictionStrategy: 'lru'
});

export const resultCache = new IntelligentCache<string, any>({
  maxSize: 200,
  maxMemory: 20,
  defaultTtl: 900000, // 15 minutes
  evictionStrategy: 'lfu'
});