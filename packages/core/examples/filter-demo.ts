/**
 * Filter functionality demonstration
 * Run: pnpm tsx filter-demo.ts
 */

import { ActionRegister } from './src/ActionRegister.js';

interface DemoActions {
  processData: { userId: string; data: any };
}

async function demonstrateFiltering() {
  const registry = new ActionRegister<DemoActions>({
    name: 'FilterDemo',
    registry: { debug: true }
  });

  console.log('🎯 Context-Action Core - Advanced Filtering Demo');
  console.log('='.repeat(50));

  // Register handlers with different priorities and configurations
  registry.register('processData', (payload, controller) => {
    console.log('🔐 Security validation executed for:', payload.userId);
    return { security: 'validated' };
  }, { 
    id: 'security-check', 
    priority: 100, 
    blocking: true 
  });

  registry.register('processData', (payload, controller) => {
    console.log('📊 Analytics tracking executed for:', payload.userId);
    return { analytics: 'tracked' };
  }, { 
    id: 'analytics', 
    priority: 80, 
    blocking: false 
  });

  registry.register('processData', (payload, controller) => {
    console.log('💾 Database save executed for:', payload.userId);
    return { database: 'saved' };
  }, { 
    id: 'database-save', 
    priority: 60, 
    blocking: true 
  });

  registry.register('processData', (payload, controller) => {
    console.log('🔔 Notification sent for:', payload.userId);
    return { notification: 'sent' };
  }, { 
    id: 'notification', 
    priority: 40, 
    blocking: false 
  });

  registry.register('processData', (payload, controller) => {
    console.log('📝 Audit log created for:', payload.userId);
    return { audit: 'logged' };
  }, { 
    id: 'audit-log', 
    priority: 20, 
    blocking: false 
  });

  const testPayload = { userId: 'user-123', data: { action: 'test' } };

  // Demo 1: No filter - all handlers execute
  console.log('\\n📋 Demo 1: No Filter (All handlers)');
  console.log('-'.repeat(30));
  const result1 = await registry.dispatchWithResult('processData', testPayload, {
    result: { collect: true, strategy: 'all' }
  });
  console.log('Results:', result1.results);

  // Demo 2: Filter by specific handler IDs
  console.log('\\n📋 Demo 2: Filter by Handler IDs');
  console.log('-'.repeat(30));
  const result2 = await registry.dispatchWithResult('processData', testPayload, {
    filter: {
      handlerIds: ['security-check', 'database-save']
    },
    result: { collect: true, strategy: 'all' }
  });
  console.log('Results:', result2.results);

  // Demo 3: Filter by priority range
  console.log('\\n📋 Demo 3: Filter by Priority Range (50-90)');
  console.log('-'.repeat(30));
  const result3 = await registry.dispatchWithResult('processData', testPayload, {
    filter: {
      priority: { min: 50, max: 90 }
    },
    result: { collect: true, strategy: 'all' }
  });
  console.log('Results:', result3.results);

  // Demo 4: Filter by minimum priority
  console.log('\\n📋 Demo 4: Filter by High Priority Only (>=80)');
  console.log('-'.repeat(30));
  const result4 = await registry.dispatchWithResult('processData', testPayload, {
    filter: {
      priority: { min: 80 }
    },
    result: { collect: true, strategy: 'all' }
  });
  console.log('Results:', result4.results);

  // Demo 5: Custom filter (only blocking handlers)
  console.log('\\n📋 Demo 5: Custom Filter (Blocking handlers only)');
  console.log('-'.repeat(30));
  const result5 = await registry.dispatchWithResult('processData', testPayload, {
    filter: {
      custom: (config) => config.blocking === true
    },
    result: { collect: true, strategy: 'all' }
  });
  console.log('Results:', result5.results);

  // Demo 6: Combined filters
  console.log('\\n📋 Demo 6: Combined Filters');
  console.log('Priority >= 50 + Exclude analytics + Only non-blocking');
  console.log('-'.repeat(30));
  const result6 = await registry.dispatchWithResult('processData', testPayload, {
    filter: {
      priority: { min: 50 },
      excludeHandlerIds: ['analytics'],
      custom: (config) => config.blocking === false
    },
    result: { collect: true, strategy: 'all' }
  });
  console.log('Results:', result6.results);

  console.log('\\n🎉 All filtering demonstrations completed!');
  console.log('='.repeat(50));

  // Show registry stats
  const stats = registry.getRegistryInfo();
  console.log('\\n📊 Registry Statistics:');
  console.log(`  Total Actions: ${stats.totalActions}`);
  console.log(`  Total Handlers: ${stats.totalHandlers}`);
  console.log(`  Registered Actions:`, stats.registeredActions);
}

// Run the demo
demonstrateFiltering().catch(console.error);