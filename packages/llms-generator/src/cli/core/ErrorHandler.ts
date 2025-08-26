/* eslint-disable no-console */
/**
 * Error Handler - Centralized error handling for CLI
 */

export class ErrorHandler {
  handle(error: unknown): void {
    if (error instanceof Error) {
      if (error.message.includes('Unknown command:')) {
        console.error(`❌ ${error.message}`);
        console.log('💡 Run "help" to see available commands');
      } else {
        console.error(`❌ Command failed: ${error.message}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.error('Stack trace:', error.stack);
        }
      }
    } else {
      console.error('❌ An unexpected error occurred:', error);
    }
  }
}