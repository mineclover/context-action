/**
 * Action-based dispatching demonstration
 * Run: pnpm tsx actions-demo.ts
 */

import { ActionRegister } from '../src/ActionRegister';
import { ActionPayloadMap } from '../src/types';

interface AppActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
  userLogout: void;
  processData: { data: any; type: string };
  sendNotification: { message: string; userId: string };
  resetApp: void;
}

async function demonstrateProtoc() {
  const registry = new ActionRegister<AppActions>({
    name: 'ProtocDemo',
    registry: { debug: true }
  });

  console.log('🎯 Context-Action Core - Action-based Dispatching Demo');
  console.log('='.repeat(60));

  // Register handlers
  registry.register('userLogin', (payload) => {
    console.log('🔐 User logged in:', payload.userId, payload.email);
    return { success: true };
  }, { id: 'login-handler', priority: 100 });

  registry.register('userLogout', () => {
    console.log('👋 User logged out');
    return { success: true };
  }, { id: 'logout-handler', priority: 100 });

  registry.register('processData', (payload) => {
    console.log('📊 Processing data:', payload.type, payload.data);
    return { processed: true };
  }, { id: 'data-processor', priority: 80 });

  registry.register('sendNotification', (payload) => {
    console.log('📱 Notification sent to', payload.userId, ':', payload.message);
    return { sent: true };
  }, { id: 'notification-sender', priority: 60 });

  registry.register('resetApp', () => {
    console.log('🔄 App reset');
    return { reset: true };
  }, { id: 'reset-handler', priority: 90 });

  // Demo 1: Basic actions usage
  console.log('\\n📋 Demo 1: Basic Action Dispatching');
  console.log('-'.repeat(40));
  
  // Function-based dispatching with payload
  await registry.actions.userLogin({ userId: '123', email: 'user@example.com' });
  

  // Function-based dispatching without payload
  await registry.actions.userLogout();
  
  // Function-based dispatching with data
  await registry.actions.processData({ data: { name: 'test' }, type: 'json' });
  
  // Function-based dispatching with notification
  await registry.actions.sendNotification({ message: 'Hello!', userId: '123' });
  
  // Function-based dispatching for reset
  await registry.actions.resetApp();

  // Demo 2: Actions with options
  console.log('\\n📋 Demo 2: Action Dispatching with Options');
  console.log('-'.repeat(40));
  
  // With execution options
  await registry.actions.processData(
    { data: { name: 'test2' }, type: 'json' },
    { executionMode: 'parallel' }
  );
  
  // With debounce
  await registry.actions.sendNotification(
    { message: 'Debounced message', userId: '456' },
    { debounce: 100 }
  );

  // Demo 3: Type safety demonstration
  console.log('\\n📋 Demo 3: Type Safety Features');
  console.log('-'.repeat(40));
  console.log('✅ TypeScript will enforce correct payload types');
  console.log('✅ Auto-completion works for all action methods');
  console.log('✅ Compile-time error checking for payload structure');
  
  // This would cause TypeScript error (commented out):
  // await registry.actions.userLogin({ wrongField: 'value' }); // ❌ Type error
  // await registry.actions.userLogout({ payload: 'should not exist' }); // ❌ Type error

  console.log('\\n🎉 Action-based dispatching demonstration completed!');
  console.log('='.repeat(60));

  // Show registry stats
  const stats = registry.getRegistryInfo();
  console.log('\\n📊 Registry Statistics:');
  console.log(`  Total Actions: ${stats.totalActions}`);
  console.log(`  Total Handlers: ${stats.totalHandlers}`);
  console.log(`  Registered Actions:`, stats.registeredActions);
}

// Run the demo
demonstrateProtoc().catch(console.error);
