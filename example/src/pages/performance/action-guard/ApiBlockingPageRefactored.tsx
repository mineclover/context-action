/**
 * @fileoverview Advanced API Blocking Demo - Context-Action API 중복 요청 방지 시스템
 * 
 * API 요청 차단 및 중복 요청 방지 시스템을 통해
 * Context-Action 프레임워크의 Store와 Action Pipeline을 활용한
 * 고급 API 블로킹 패턴과 성능 최적화를 보여주는 데모입니다.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createActionContext, createStoreContext, useStoreValue } from '@context-action/react';

// ===== 타입 정의 =====
interface ApiCallRecord {
  id: string;
  endpoint: string;
  timestamp: number;
  status: 'success' | 'blocked' | 'error' | 'pending';
  responseTime?: number;
  method: string;
  reason?: string;
}

interface ApiBlockingActions {
  makeApiCall: { endpoint: string; method: string; timestamp: number };
  apiCallSuccess: { callId: string; endpoint: string; responseTime: number; timestamp: number };
  apiCallBlocked: { endpoint: string; reason: string; timestamp: number };
  apiCallError: { endpoint: string; error: string; timestamp: number };
  startBlocking: { action: string; duration: number; timestamp: number };
  endBlocking: { action: string; timestamp: number };
  setBlockDuration: { duration: number };
  clearHistory: void;
  configureRateLimit: { enabled: boolean; maxRequests: number; windowMs: number };
}

interface BlockingMetrics {
  totalRequests: number;
  successfulRequests: number;
  blockedRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  successRate: number;
  blockingEfficiency: number;
  currentLoadLevel: 'low' | 'medium' | 'high';
}

interface RateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  currentWindow: number;
  requestsInWindow: number;
}

// ===== Store Context =====
const {
  Provider: ApiBlockingStoreProvider,
  useStore: useApiBlockingStore,
} = createStoreContext('AdvancedApiBlocking', {
  apiCalls: [] as ApiCallRecord[],
  isBlocked: false,
  blockedAction: null as string | null,
  blockEndTime: null as number | null,
  blockDuration: 2000,
  rateLimit: {
    enabled: true,
    maxRequests: 5,
    windowMs: 10000,
    currentWindow: Date.now(),
    requestsInWindow: 0
  } as RateLimitConfig,
  metrics: {
    totalRequests: 0,
    successfulRequests: 0,
    blockedRequests: 0,
    errorRequests: 0,
    averageResponseTime: 0,
    successRate: 100,
    blockingEfficiency: 0,
    currentLoadLevel: 'low' as const
  } as BlockingMetrics
});

// ===== Action Context =====
const { Provider: ApiBlockingActionProvider, useActionDispatch, useActionHandler } = 
  createActionContext<ApiBlockingActions>('AdvancedApiBlocking');

// ===== API 엔드포인트 데이터 =====
const apiEndpoints = [
  { path: '/api/users', method: 'GET', category: 'Users', load: 'high' },
  { path: '/api/posts', method: 'GET', category: 'Content', load: 'medium' },
  { path: '/api/comments', method: 'POST', category: 'Content', load: 'low' },
  { path: '/api/profile', method: 'PUT', category: 'Users', load: 'medium' },
  { path: '/api/settings', method: 'PATCH', category: 'Config', load: 'low' },
  { path: '/api/analytics', method: 'GET', category: 'Analytics', load: 'high' },
  { path: '/api/notifications', method: 'GET', category: 'System', load: 'medium' },
  { path: '/api/upload', method: 'POST', category: 'File', load: 'high' }
];

// ===== 메인 페이지 컴포넌트 =====
export function ApiBlockingPageRefactored() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* 1. Architecture Section */}
        <ArchitectureSection />
        
        <ApiBlockingStoreProvider>
          <ApiBlockingActionProvider>
            {/* 2. Demo Section */}
            <DemoSection />
            
            {/* 3. Status Section */}
            <StatusSection />
            
            {/* 4. Code Section */}
            <CodeSection />
          </ApiBlockingActionProvider>
        </ApiBlockingStoreProvider>
      </div>
    </div>
  );
}

// ===== 1. Architecture Section =====
function ArchitectureSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
          <span className="w-8 h-8 text-white flex items-center justify-center text-2xl">🛡️</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced API Blocking System</h1>
          <p className="text-gray-600">API 요청 차단 및 중복 요청 방지 시스템</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
            <h3 className="text-xl font-semibold text-orange-900 mb-4">🎯 System Architecture</h3>
            <div className="space-y-4 text-orange-800">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Request Blocking:</strong> 중복 API 요청을 시간 기반으로 차단
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Rate Limiting:</strong> 설정 가능한 요청 빈도 제한 시스템
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Performance Metrics:</strong> 실시간 API 성능 및 차단 효율성 추적
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">⚡ Key Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-sm">🛡️</span>
                  <span>중복 요청 차단</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-sm">⏰</span>
                  <span>설정 가능한 블록 타임</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-sm">🖥️</span>
                  <span>Rate Limiting 시스템</span>
                </div>
              </div>
              <div className="space-y-2 text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-sm">📊</span>
                  <span>실시간 메트릭스</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-sm">📈</span>
                  <span>성능 최적화 분석</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-sm">🌐</span>
                  <span>다중 엔드포인트 지원</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <h3 className="text-xl font-semibold text-green-900 mb-4">🔄 Blocking Flow</h3>
            <div className="space-y-3 text-sm text-green-800">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>API Request</span>
                <span>→</span>
                <span>Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>Block Check</span>
                <span>→</span>
                <span>Rate Limit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>Process/Block</span>
                <span>→</span>
                <span>Response</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <h3 className="text-xl font-semibold text-purple-900 mb-4">🛡️ Protection</h3>
            <div className="space-y-2 text-purple-800 text-sm">
              <div>• Double-click prevention</div>
              <div>• Server load reduction</div>
              <div>• Rate limit compliance</div>
              <div>• Resource optimization</div>
              <div>• User experience improvement</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== 2. Demo Section =====
function DemoSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🎯 Interactive API Blocking Demo</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Blocking System Active</span>
        </div>
      </div>
      
      <ApiBlockingDemoInterface />
    </section>
  );
}

// ===== API Blocking Demo Interface =====
function ApiBlockingDemoInterface() {
  const dispatch = useActionDispatch();
  const blockingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Store subscriptions
  const apiCallsStore = useApiBlockingStore('apiCalls');
  const isBlockedStore = useApiBlockingStore('isBlocked');
  const blockedActionStore = useApiBlockingStore('blockedAction');
  const blockEndTimeStore = useApiBlockingStore('blockEndTime');
  const blockDurationStore = useApiBlockingStore('blockDuration');
  const rateLimitStore = useApiBlockingStore('rateLimit');
  const metricsStore = useApiBlockingStore('metrics');
  
  const apiCalls = useStoreValue(apiCallsStore) || [];
  const isBlocked = useStoreValue(isBlockedStore);
  const blockedAction = useStoreValue(blockedActionStore);
  const blockEndTime = useStoreValue(blockEndTimeStore);
  const blockDuration = useStoreValue(blockDurationStore) || 2000;
  const rateLimit = useStoreValue(rateLimitStore);
  const metrics = useStoreValue(metricsStore);

  // Helper functions
  const isCurrentlyBlocked = useCallback(() => {
    if (!isBlocked || !blockEndTime) return false;
    return Date.now() < blockEndTime;
  }, [isBlocked, blockEndTime]);

  const isRateLimited = useCallback(() => {
    if (!rateLimit?.enabled) return false;
    const now = Date.now();
    const windowStart = Math.floor(now / rateLimit.windowMs) * rateLimit.windowMs;
    
    if (windowStart !== rateLimit.currentWindow) {
      // New window, reset counter
      rateLimitStore.setValue({
        ...rateLimit,
        currentWindow: windowStart,
        requestsInWindow: 0
      });
      return false;
    }
    
    return rateLimit.requestsInWindow >= rateLimit.maxRequests;
  }, [rateLimit, rateLimitStore]);

  const simulateApiCall = useCallback(async (endpoint: string): Promise<{success: boolean; responseTime: number}> => {
    const responseTime = Math.random() * 800 + 200;
    await new Promise(resolve => setTimeout(resolve, responseTime));
    
    return {
      success: Math.random() > 0.15, // 15% failure rate
      responseTime: Math.round(responseTime)
    };
  }, []);

  // Action handlers
  useActionHandler('makeApiCall', useCallback(async (payload) => {
    const { endpoint, method, timestamp } = payload;
    const callId = `call-${timestamp}`;
    
    // Add pending request
    const pendingRecord: ApiCallRecord = {
      id: callId,
      endpoint,
      timestamp,
      status: 'pending',
      method
    };
    
    apiCallsStore.setValue([pendingRecord, ...apiCalls].slice(0, 50));
    
    // Check if blocked
    if (isCurrentlyBlocked()) {
      dispatch('apiCallBlocked', {
        endpoint,
        reason: 'Request blocked by timing constraint',
        timestamp: Date.now()
      });
      return;
    }
    
    // Check rate limit
    if (isRateLimited()) {
      dispatch('apiCallBlocked', {
        endpoint,
        reason: 'Rate limit exceeded',
        timestamp: Date.now()
      });
      return;
    }
    
    // Start blocking
    dispatch('startBlocking', {
      action: 'apiCall',
      duration: blockDuration,
      timestamp: Date.now()
    });
    
    // Update rate limit counter
    if (rateLimit?.enabled) {
      rateLimitStore.setValue({
        ...rateLimit,
        requestsInWindow: rateLimit.requestsInWindow + 1
      });
    }
    
    try {
      const result = await simulateApiCall(endpoint);
      
      if (result.success) {
        dispatch('apiCallSuccess', {
          callId,
          endpoint,
          responseTime: result.responseTime,
          timestamp: Date.now()
        });
      } else {
        dispatch('apiCallError', {
          endpoint,
          error: 'Simulated API error',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      dispatch('apiCallError', {
        endpoint,
        error: 'Network error',
        timestamp: Date.now()
      });
    }
  }, [dispatch, apiCalls, apiCallsStore, isCurrentlyBlocked, isRateLimited, blockDuration, rateLimit, rateLimitStore, simulateApiCall]));

  useActionHandler('apiCallSuccess', useCallback(async (payload) => {
    const { callId, endpoint, responseTime, timestamp } = payload;
    
    // Update the pending record
    const updatedCalls = apiCalls.map(call => 
      call.id === callId 
        ? { ...call, status: 'success' as const, responseTime, timestamp }
        : call
    );
    
    apiCallsStore.setValue(updatedCalls);
    
    // Update metrics
    const currentMetrics = metricsStore.getValue();
    const newTotalRequests = currentMetrics.totalRequests + 1;
    const newSuccessfulRequests = currentMetrics.successfulRequests + 1;
    const newAverageResponseTime = ((currentMetrics.averageResponseTime * currentMetrics.totalRequests) + responseTime) / newTotalRequests;
    
    metricsStore.setValue({
      ...currentMetrics,
      totalRequests: newTotalRequests,
      successfulRequests: newSuccessfulRequests,
      averageResponseTime: newAverageResponseTime,
      successRate: (newSuccessfulRequests / newTotalRequests) * 100,
      currentLoadLevel: responseTime > 600 ? 'high' : responseTime > 400 ? 'medium' : 'low'
    });
  }, [apiCalls, apiCallsStore, metricsStore]));

  useActionHandler('apiCallBlocked', useCallback(async (payload) => {
    const { endpoint, reason, timestamp } = payload;
    
    // Find and update the pending record
    const updatedCalls = apiCalls.map(call => 
      call.timestamp <= timestamp && call.endpoint === endpoint && call.status === 'pending'
        ? { ...call, status: 'blocked' as const, reason, timestamp }
        : call
    );
    
    apiCallsStore.setValue(updatedCalls);
    
    // Update metrics
    const currentMetrics = metricsStore.getValue();
    metricsStore.setValue({
      ...currentMetrics,
      totalRequests: currentMetrics.totalRequests + 1,
      blockedRequests: currentMetrics.blockedRequests + 1,
      blockingEfficiency: ((currentMetrics.blockedRequests + 1) / (currentMetrics.totalRequests + 1)) * 100
    });
  }, [apiCalls, apiCallsStore, metricsStore]));

  useActionHandler('apiCallError', useCallback(async (payload) => {
    const { endpoint, error, timestamp } = payload;
    
    // Find and update the pending record
    const updatedCalls = apiCalls.map(call => 
      call.timestamp <= timestamp && call.endpoint === endpoint && call.status === 'pending'
        ? { ...call, status: 'error' as const, reason: error, timestamp }
        : call
    );
    
    apiCallsStore.setValue(updatedCalls);
    
    // Update metrics
    const currentMetrics = metricsStore.getValue();
    metricsStore.setValue({
      ...currentMetrics,
      totalRequests: currentMetrics.totalRequests + 1,
      errorRequests: currentMetrics.errorRequests + 1
    });
  }, [apiCalls, apiCallsStore, metricsStore]));

  useActionHandler('startBlocking', useCallback(async (payload) => {
    const { action, duration, timestamp } = payload;
    
    isBlockedStore.setValue(true);
    blockedActionStore.setValue(action);
    blockEndTimeStore.setValue(timestamp + duration);
    
    // Clear any existing timeout
    if (blockingTimeoutRef.current) {
      clearTimeout(blockingTimeoutRef.current);
    }
    
    // Set timeout to end blocking
    blockingTimeoutRef.current = setTimeout(() => {
      dispatch('endBlocking', { action, timestamp: Date.now() });
    }, duration);
  }, [dispatch, isBlockedStore, blockedActionStore, blockEndTimeStore]));

  useActionHandler('endBlocking', useCallback(async (payload) => {
    isBlockedStore.setValue(false);
    blockedActionStore.setValue(null);
    blockEndTimeStore.setValue(null);
  }, [isBlockedStore, blockedActionStore, blockEndTimeStore]));

  useActionHandler('setBlockDuration', useCallback(async (payload) => {
    blockDurationStore.setValue(payload.duration);
  }, [blockDurationStore]));

  useActionHandler('clearHistory', useCallback(async () => {
    apiCallsStore.setValue([]);
    metricsStore.setValue({
      totalRequests: 0,
      successfulRequests: 0,
      blockedRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
      successRate: 100,
      blockingEfficiency: 0,
      currentLoadLevel: 'low'
    });
  }, [apiCallsStore, metricsStore]));

  useActionHandler('configureRateLimit', useCallback(async (payload) => {
    const currentRateLimit = rateLimitStore.getValue();
    rateLimitStore.setValue({
      ...currentRateLimit,
      ...payload,
      currentWindow: Date.now(),
      requestsInWindow: 0
    });
  }, [rateLimitStore]));

  // Remaining block time
  const remainingBlockTime = blockEndTime ? Math.max(0, blockEndTime - Date.now()) : 0;

  return (
    <div className="space-y-8">
      {/* Configuration Panel */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-5 h-5" />
          차단 시스템 설정
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Block Duration */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">블록 지속시간</h4>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={blockDuration}
                onChange={(e) => dispatch('setBlockDuration', { duration: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {blockDuration}ms
              </span>
            </div>
          </div>
          
          {/* Rate Limiting */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Rate Limiting</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rateLimit?.enabled || false}
                  onChange={(e) => dispatch('configureRateLimit', {
                    enabled: e.target.checked,
                    maxRequests: rateLimit?.maxRequests || 5,
                    windowMs: rateLimit?.windowMs || 10000
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">활성화</span>
              </div>
              <div className="text-xs text-gray-600">
                {rateLimit?.maxRequests || 5}회 / {((rateLimit?.windowMs || 10000) / 1000)}초
                (현재: {rateLimit?.requestsInWindow || 0}회)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {apiEndpoints.map((endpoint, index) => (
          <div key={endpoint.path} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold text-sm text-gray-900">{endpoint.path}</div>
                <div className="text-xs text-gray-600">{endpoint.method} • {endpoint.category}</div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                endpoint.load === 'high' ? 'bg-red-100 text-red-700' :
                endpoint.load === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {endpoint.load}
              </div>
            </div>
            
            <button
              onClick={() => dispatch('makeApiCall', {
                endpoint: endpoint.path,
                method: endpoint.method,
                timestamp: Date.now()
              })}
              disabled={isCurrentlyBlocked() || (rateLimit?.enabled && isRateLimited())}
              className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="w-4 h-4" />
              {endpoint.method}
            </button>
          </div>
        ))}
      </div>

      {/* Blocking Status */}
      {isCurrentlyBlocked() && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-800">
                API 요청 차단 중 ({Math.ceil(remainingBlockTime / 1000)}초 남음)
              </span>
            </div>
            <div className="text-sm text-orange-600">
              액션: {blockedAction}
            </div>
          </div>
          <div className="bg-orange-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${(remainingBlockTime / blockDuration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{metrics?.successfulRequests || 0}</div>
          <div className="text-sm text-green-800">성공</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{metrics?.blockedRequests || 0}</div>
          <div className="text-sm text-red-800">차단됨</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{metrics?.errorRequests || 0}</div>
          <div className="text-sm text-orange-800">에러</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{Math.round(metrics?.averageResponseTime || 0)}ms</div>
          <div className="text-sm text-blue-800">평균 응답시간</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{Math.round(metrics?.successRate || 0)}%</div>
          <div className="text-sm text-purple-800">성공률</div>
        </div>
      </div>

      {/* Request History */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-5 h-5" />
            최근 API 요청 기록
          </h3>
          <button
            onClick={() => dispatch('clearHistory')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
          >
            <span className="w-4 h-4" />
            기록 지우기
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {apiCalls.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              API 버튼을 클릭하여 요청을 시작하세요
            </div>
          ) : (
            apiCalls.map((call) => (
              <div
                key={call.id}
                className={`p-4 rounded-lg border text-sm transition-all ${
                  call.status === 'success' ? 'bg-green-50 border-green-200' :
                  call.status === 'blocked' ? 'bg-red-50 border-red-200' :
                  call.status === 'error' ? 'bg-orange-50 border-orange-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {call.status === 'success' ? <span className="w-4 h-4 text-green-600" /> :
                       call.status === 'blocked' ? <span className="w-4 h-4 text-red-600" /> :
                       call.status === 'error' ? <span className="w-4 h-4 text-orange-600" /> :
                       <span className="w-4 h-4 text-blue-600" />}
                      <span className="font-mono font-medium">{call.endpoint}</span>
                      <span className="text-xs bg-white px-2 py-1 rounded">{call.method}</span>
                    </div>
                    {call.responseTime && (
                      <div className="text-xs text-gray-600">응답시간: {call.responseTime}ms</div>
                    )}
                    {call.reason && (
                      <div className="text-xs text-gray-600">이유: {call.reason}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      call.status === 'success' ? 'bg-green-100 text-green-800' :
                      call.status === 'blocked' ? 'bg-red-100 text-red-800' :
                      call.status === 'error' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {call.status}
                    </span>
                    <span className="text-gray-500">
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 3. Status Section =====
function StatusSection() {
  const metricsStore = useApiBlockingStore('metrics');
  const isBlockedStore = useApiBlockingStore('isBlocked');
  const rateLimitStore = useApiBlockingStore('rateLimit');
  const apiCallsStore = useApiBlockingStore('apiCalls');
  
  const metrics = useStoreValue(metricsStore);
  const isBlocked = useStoreValue(isBlockedStore);
  const rateLimit = useStoreValue(rateLimitStore);
  const apiCalls = useStoreValue(apiCallsStore) || [];

  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
          <span className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Blocking Analytics</h2>
          <p className="text-gray-600">실시간 API 차단 성능 및 시스템 상태</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Request Metrics */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5" />
              요청 메트릭스
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">총 요청 수</span>
                <span className="font-bold text-blue-900">{metrics?.totalRequests || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">평균 응답시간</span>
                <span className="font-bold text-blue-900">{Math.round(metrics?.averageResponseTime || 0)}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">성공률</span>
                <span className="font-bold text-blue-900">{Math.round(metrics?.successRate || 0)}%</span>
              </div>
            </div>
          </div>

          {/* Blocking Efficiency */}
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5" />
              차단 효율성
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-orange-700">차단된 요청</span>
                <span className="font-bold text-orange-900">{metrics?.blockedRequests || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-700">차단 효율성</span>
                <span className="font-bold text-orange-900">{Math.round(metrics?.blockingEfficiency || 0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-700">현재 상태</span>
                <span className={`font-bold ${isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                  {isBlocked ? '차단 중' : '활성'}
                </span>
              </div>
            </div>
          </div>

          {/* Load Level */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5" />
              시스템 부하
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-700">현재 부하 수준</span>
                <span className={`font-bold ${
                  metrics?.currentLoadLevel === 'high' ? 'text-red-600' :
                  metrics?.currentLoadLevel === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {metrics?.currentLoadLevel === 'high' ? '높음' :
                   metrics?.currentLoadLevel === 'medium' ? '보통' : '낮음'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700">에러 요청</span>
                <span className="font-bold text-purple-900">{metrics?.errorRequests || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700">Rate Limit</span>
                <span className={`font-bold ${rateLimit?.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {rateLimit?.enabled ? '활성' : '비활성'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <h3 className="text-lg font-semibold text-green-900 mb-4">⚡ 실시간 상태</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-700">API 차단 시스템 활성</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${rateLimit?.enabled ? 'bg-blue-500' : 'bg-gray-400'}`} />
                <span className="text-green-700">Rate Limiting {rateLimit?.enabled ? '활성' : '비활성'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isBlocked ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-green-700">요청 차단 {isBlocked ? '중' : '대기'}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 성능 차트</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">차단 효율</span>
                  <span className="text-gray-900 font-medium">{Math.round(metrics?.blockingEfficiency || 0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, metrics?.blockingEfficiency || 0)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">시스템 성능</span>
                  <span className="text-gray-900 font-medium">
                    {metrics?.currentLoadLevel === 'high' ? '70%' :
                     metrics?.currentLoadLevel === 'medium' ? '85%' : '95%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metrics?.currentLoadLevel === 'high' ? 'bg-red-500' :
                      metrics?.currentLoadLevel === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${
                      metrics?.currentLoadLevel === 'high' ? '70%' :
                      metrics?.currentLoadLevel === 'medium' ? '85%' : '95%'
                    }` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== 4. Code Section =====
function CodeSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
          <span className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Implementation Details</h2>
          <p className="text-gray-600">핵심 API 차단 시스템 구현 코드</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🏪 Store Context</h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`const { Provider, useStore } = createStoreContext('AdvancedApiBlocking', {
  apiCalls: [] as ApiCallRecord[],
  isBlocked: false,
  blockedAction: null as string | null,
  blockEndTime: null as number | null,
  blockDuration: 2000,
  rateLimit: {
    enabled: true,
    maxRequests: 5,
    windowMs: 10000,
    currentWindow: Date.now(),
    requestsInWindow: 0
  } as RateLimitConfig,
  metrics: {
    totalRequests: 0,
    successfulRequests: 0,
    blockedRequests: 0,
    errorRequests: 0,
    averageResponseTime: 0,
    successRate: 100,
    blockingEfficiency: 0,
    currentLoadLevel: 'low' as const
  } as BlockingMetrics
});`}
            </pre>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🛡️ Blocking Logic</h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`useActionHandler('makeApiCall', useCallback(async (payload) => {
  const { endpoint, method, timestamp } = payload;
  
  // Check if currently blocked
  if (isCurrentlyBlocked()) {
    dispatch('apiCallBlocked', {
      endpoint,
      reason: 'Request blocked by timing constraint',
      timestamp: Date.now()
    });
    return;
  }
  
  // Check rate limit
  if (isRateLimited()) {
    dispatch('apiCallBlocked', {
      endpoint,
      reason: 'Rate limit exceeded',
      timestamp: Date.now()
    });
    return;
  }
  
  // Start blocking period
  dispatch('startBlocking', {
    action: 'apiCall',
    duration: blockDuration,
    timestamp: Date.now()
  });
  
  // Execute API call
  try {
    const result = await simulateApiCall(endpoint);
    if (result.success) {
      dispatch('apiCallSuccess', {
        callId: \`call-\${timestamp}\`,
        endpoint,
        responseTime: result.responseTime,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    dispatch('apiCallError', {
      endpoint,
      error: error.message,
      timestamp: Date.now()
    });
  }
}, [dispatch, blockDuration, isCurrentlyBlocked, isRateLimited]));`}
            </pre>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Rate Limiting</h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`const isRateLimited = useCallback(() => {
  if (!rateLimit?.enabled) return false;
  
  const now = Date.now();
  const windowStart = Math.floor(now / rateLimit.windowMs) * rateLimit.windowMs;
  
  // Check if new window started
  if (windowStart !== rateLimit.currentWindow) {
    // Reset counter for new window
    rateLimitStore.setValue({
      ...rateLimit,
      currentWindow: windowStart,
      requestsInWindow: 0
    });
    return false;
  }
  
  // Check if limit exceeded
  return rateLimit.requestsInWindow >= rateLimit.maxRequests;
}, [rateLimit, rateLimitStore]);

// Increment counter on successful validation
if (rateLimit?.enabled) {
  rateLimitStore.setValue({
    ...rateLimit,
    requestsInWindow: rateLimit.requestsInWindow + 1
  });
}`}
            </pre>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">📈 Metrics Tracking</h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`// Success metrics update
const currentMetrics = metricsStore.getValue();
const newTotalRequests = currentMetrics.totalRequests + 1;
const newSuccessfulRequests = currentMetrics.successfulRequests + 1;
const newAverageResponseTime = (
  (currentMetrics.averageResponseTime * currentMetrics.totalRequests) + responseTime
) / newTotalRequests;

metricsStore.setValue({
  ...currentMetrics,
  totalRequests: newTotalRequests,
  successfulRequests: newSuccessfulRequests,
  averageResponseTime: newAverageResponseTime,
  successRate: (newSuccessfulRequests / newTotalRequests) * 100,
  currentLoadLevel: responseTime > 600 ? 'high' : 
                   responseTime > 400 ? 'medium' : 'low',
  blockingEfficiency: (blockedRequests / totalRequests) * 100
});`}
            </pre>
          </div>

          <div className="p-6 bg-orange-50 rounded-xl">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">🔧 Key Features</h3>
            <ul className="space-y-2 text-orange-800 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>시간 기반 요청 차단으로 중복 방지</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>설정 가능한 Rate Limiting 시스템</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full" />
                <span>실시간 성능 메트릭스 추적</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>차단 효율성 분석 및 최적화</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <span>다양한 API 엔드포인트 지원</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ApiBlockingPageRefactored;