import { useCallback } from 'react';
import { useConditionalActionHandler, useConditionalStoreManager } from '../stores';
import { mockServices } from '../mockServices';
import { addLog, isWithinBusinessHours, getNextBusinessHour } from '../utils';

export function ScheduleHandlers() {
  const stores = useConditionalStoreManager();

  // Business hours handler
  useConditionalActionHandler('processScheduledTask', useCallback(async (payload, controller) => {
    const now = new Date();
    const businessHours = isWithinBusinessHours(now);
    const logsStore = stores.getStore('logs');
    
    logsStore.update(logs => addLog(logs, 'info', '⏰ Schedule check started', { 
      taskType: payload.taskType,
      isBusinessHours: businessHours,
      currentTime: now.toISOString()
    }));
    
    if (!businessHours) {
      const nextTime = getNextBusinessHour(now);
      const result = { 
        deferred: true, 
        reason: 'outside-business-hours',
        nextAvailableTime: nextTime.toISOString()
      };
      
      logsStore.update(logs => addLog(logs, 'warning', '⏸️ Task deferred to business hours', result));
      // Task deferred - no further processing needed
      return;
    }
    
    try {
      const result = await mockServices.processBusinessHoursTask(payload.taskType);
      
      const scheduleResult = {
        processedDuringBusinessHours: true,
        result,
        processedAt: now.toISOString(),
        timestamp: Date.now()
      };
      
      const scheduleStore = stores.getStore('scheduleResults');
      scheduleStore.update(results => [...results, scheduleResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Business hours task completed', scheduleResult));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Business hours task failed', { error: errorMessage }));
      controller.abort(`Business hours task failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 100,
    id: 'business-hours-processor',
    tags: ['scheduled', 'business-hours']
  });

  // Off-hours handler (lower priority)
  useConditionalActionHandler('processScheduledTask', useCallback(async (payload, controller) => {
    const now = new Date();
    const businessHours = isWithinBusinessHours(now);
    const logsStore = stores.getStore('logs');
    
    // Only run if business hours handler didn't process
    if (businessHours) {
      return; // Let business hours handler take care of it
    }
    
    logsStore.update(logs => addLog(logs, 'info', '🌙 Off-hours processing started', { 
      taskType: payload.taskType,
      currentTime: now.toISOString()
    }));
    
    try {
      const result = await mockServices.processOffHoursTask(payload.taskType);
      
      const scheduleResult = {
        processedDuringBusinessHours: false,
        result,
        processedAt: now.toISOString(),
        offHoursProcessing: true,
        timestamp: Date.now()
      };
      
      const scheduleStore = stores.getStore('scheduleResults');
      scheduleStore.update(results => [...results, scheduleResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Off-hours task completed', scheduleResult));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Off-hours task failed', { error: errorMessage }));
      controller.abort(`Off-hours task failed: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 50,
    id: 'off-hours-processor',
    tags: ['scheduled', 'off-hours']
  });

  return null;
}