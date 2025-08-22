import React, { useState } from 'react';
import { useConditionalAction } from '../stores';
import { isWithinBusinessHours } from '../utils';

export function ScheduleControls() {
  const dispatch = useConditionalAction();
  const [taskType, setTaskType] = useState('data-processing');

  const handleScheduleTask = () => {
    dispatch('processScheduledTask', {
      taskType,
      scheduledTime: Date.now()
    });
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">⏰ Time-Based Execution</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Task Type:</label>
        <select 
          value={taskType} 
          onChange={(e) => setTaskType(e.target.value)}
          className="border rounded px-3 py-1 w-full"
        >
          <option value="data-processing">Data Processing</option>
          <option value="report-generation">Report Generation</option>
          <option value="system-cleanup">System Cleanup</option>
          <option value="backup-verification">Backup Verification</option>
        </select>
      </div>
      
      <button 
        onClick={handleScheduleTask}
        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
      >
        Schedule Task
      </button>
      
      <p className="text-sm text-gray-600 mt-2">
        Current: {isWithinBusinessHours(new Date()) ? '🏢 Business Hours' : '🌙 Off Hours'}
        <br />
        Tasks process differently based on current time.
      </p>
    </div>
  );
}