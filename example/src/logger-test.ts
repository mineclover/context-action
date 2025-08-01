/**
 * Logger integration test file
 * Tests logging functionality across all packages
 */

import { 
  createLogger, 
  LogLevel, 
  getLogLevelFromEnv,
  createStore,
  StoreRegistry,
  ActionRegister 
} from '@context-action/react';

// Test logger creation and configuration
console.log('=== Logger Integration Test ===');

// Create logger with different levels
const traceLogger = createLogger(LogLevel.TRACE);
const debugLogger = createLogger(LogLevel.DEBUG);
const infoLogger = createLogger(LogLevel.INFO);
const errorLogger = createLogger(LogLevel.ERROR);

console.log('\n1. Logger Level Tests:');
traceLogger.trace('Trace message test', { level: 'TRACE' });
traceLogger.debug('Debug message test', { level: 'DEBUG' });
traceLogger.info('Info message test', { level: 'INFO' });
traceLogger.warn('Warn message test', { level: 'WARN' });
traceLogger.error('Error message test', { level: 'ERROR' });

console.log('\n2. Store Logging Test:');
// Test store operations with logging
const userStore = createStore('testUser', { id: 1, name: 'John', email: 'john@example.com' });
console.log('Store created with logging');

userStore.setValue({ id: 1, name: 'Jane', email: 'jane@example.com' });
console.log('Store value updated with logging');

userStore.update(user => ({ ...user, name: 'Bob' }));
console.log('Store updated with logging');

// Test subscription logging
const unsubscribe = userStore.subscribe(() => {
  console.log('Store change detected');
});
console.log('Store subscribed with logging');

userStore.setValue({ id: 2, name: 'Alice', email: 'alice@example.com' });
unsubscribe();
console.log('Store unsubscribed with logging');

console.log('\n3. StoreRegistry Logging Test:');
// Test registry operations with logging
const registry = new StoreRegistry('testRegistry');
console.log('Registry created with logging');

registry.register('user', userStore);
console.log('Store registered with logging');

const retrievedStore = registry.getStore('user');
console.log('Store retrieved with logging');

registry.unregister('user');
console.log('Store unregistered with logging');

console.log('\n4. ActionRegister Logging Test:');
// Test action register with logging
interface TestActions {
  test: string;
  increment: void;
}

const actionRegister = new ActionRegister<TestActions>({
  logLevel: LogLevel.DEBUG,
  debug: true
});

actionRegister.register('test', (payload, controller) => {
  console.log(`Action handler executed: ${payload}`);
  controller.next();
});

actionRegister.dispatch('test', 'Hello World!');

console.log('\n5. Environment Configuration Test:');
console.log('Current log level from env:', getLogLevelFromEnv());
console.log('Logger integration test completed');

export {};