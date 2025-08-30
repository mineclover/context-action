import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createActionContext, createStoreContext, useStoreValue } from '@context-action/react';

interface WorkflowData {
  userId: string;
  email: string;
  accountType: 'basic' | 'premium' | 'enterprise';
}

interface StepResult {
  step: string;
  success: boolean;
  message: string;
  timestamp: number;
  data?: any;
}

interface WorkflowActions {
  startWorkflow: { data: WorkflowData };
  executeStep: { step: string };
  resetWorkflow: void;
}

const { Provider: WorkflowActionProvider, useActionDispatch: useWorkflowAction, useActionHandler: useWorkflowHandler } = createActionContext<WorkflowActions>('WorkflowSteps');

const { Provider: WorkflowStoreProvider, useStore: useWorkflowStore } = createStoreContext('WorkflowSteps', {
  currentStep: { initialValue: 0 },
  workflowData: { initialValue: null as WorkflowData | null },
  stepResults: { initialValue: [] as StepResult[] },
  isProcessing: { initialValue: false },
  workflowComplete: { initialValue: false }
});

const WORKFLOW_STEPS = [
  { id: 'validation', name: 'Data Validation', description: 'Validate input data' },
  { id: 'account-setup', name: 'Account Setup', description: 'Create user account' },
  { id: 'permissions', name: 'Permission Assignment', description: 'Assign role-based permissions' },
  { id: 'notification', name: 'Welcome Notification', description: 'Send welcome email' },
  { id: 'completion', name: 'Workflow Complete', description: 'Finalize setup' }
];

function WorkflowStepsContent() {
  const dispatch = useWorkflowAction();
  
  const currentStepStore = useWorkflowStore('currentStep');
  const workflowDataStore = useWorkflowStore('workflowData');
  const stepResultsStore = useWorkflowStore('stepResults');
  const isProcessingStore = useWorkflowStore('isProcessing');
  const workflowCompleteStore = useWorkflowStore('workflowComplete');
  
  const [formData, setFormData] = useState<WorkflowData>({
    userId: '',
    email: '',
    accountType: 'basic'
  });
  
  useWorkflowHandler('startWorkflow', useCallback(async (payload, controller) => {
    const { data } = payload;
    
    workflowDataStore.setValue(data);
    currentStepStore.setValue(0);
    stepResultsStore.setValue([]);
    workflowCompleteStore.setValue(false);
    isProcessingStore.setValue(true);
    
    
    await dispatch('executeStep', { step: 'validation' });
  }, [workflowDataStore, currentStepStore, stepResultsStore, workflowCompleteStore, isProcessingStore, dispatch]));
  
  useWorkflowHandler('executeStep', useCallback(async (payload, controller) => {
    const { step } = payload;
    const currentResults = stepResultsStore.getValue();
    const currentStepIndex = currentStepStore.getValue();
    const workflowData = workflowDataStore.getValue();
    
    if (!workflowData) {
      controller.abort('No workflow data available');
      return;
    }
    
    let stepResult: StepResult;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (step === 'validation') {
        const isValid = workflowData.userId && workflowData.email.includes('@');
        if (!isValid) {
          throw new Error('Invalid user data');
        }
        stepResult = {
          step: 'validation',
          success: true,
          message: 'Data validation passed',
          timestamp: Date.now(),
          data: { validatedFields: ['userId', 'email'] }
        };
      } else if (step === 'account-setup') {
        stepResult = {
          step: 'account-setup',
          success: true,
          message: `${workflowData.accountType.toUpperCase()} account created`,
          timestamp: Date.now(),
          data: { accountId: `acc_${Date.now()}` }
        };
      } else if (step === 'permissions') {
        const permissions = workflowData.accountType === 'enterprise' 
          ? ['read', 'write', 'admin'] 
          : workflowData.accountType === 'premium' 
            ? ['read', 'write'] 
            : ['read'];
        stepResult = {
          step: 'permissions',
          success: true,
          message: `Assigned ${permissions.length} permissions`,
          timestamp: Date.now(),
          data: { permissions }
        };
      } else if (step === 'notification') {
        stepResult = {
          step: 'notification',
          success: true,
          message: `Welcome email sent to ${workflowData.email}`,
          timestamp: Date.now(),
          data: { emailSent: true }
        };
      } else if (step === 'completion') {
        stepResult = {
          step: 'completion',
          success: true,
          message: 'Workflow completed successfully',
          timestamp: Date.now(),
          data: { completedAt: new Date().toISOString() }
        };
        workflowCompleteStore.setValue(true);
        isProcessingStore.setValue(false);
      } else {
        throw new Error(`Unknown step: ${step}`);
      }
    } catch (error) {
      stepResult = {
        step,
        success: false,
        message: error instanceof Error ? error.message : 'Step failed',
        timestamp: Date.now()
      };
      isProcessingStore.setValue(false);
    }
    
    const updatedResults = [...currentResults, stepResult];
    stepResultsStore.setValue(updatedResults);
    
    if (stepResult.success && currentStepIndex < WORKFLOW_STEPS.length - 1) {
      const nextStepIndex = currentStepIndex + 1;
      currentStepStore.setValue(nextStepIndex);
      
      if (nextStepIndex < WORKFLOW_STEPS.length) {
        const nextStep = WORKFLOW_STEPS[nextStepIndex];
        if (nextStep) {
          await dispatch('executeStep', { step: nextStep.id });
        }
      }
    }
    
  }, [stepResultsStore, currentStepStore, workflowDataStore, workflowCompleteStore, isProcessingStore, dispatch]));
  
  useWorkflowHandler('resetWorkflow', useCallback(async (payload, controller) => {
    currentStepStore.setValue(0);
    workflowDataStore.setValue(null);
    stepResultsStore.setValue([]);
    workflowCompleteStore.setValue(false);
    isProcessingStore.setValue(false);
    
  }, [currentStepStore, workflowDataStore, stepResultsStore, workflowCompleteStore, isProcessingStore]));
  
  const currentStep = useStoreValue(currentStepStore);
  const stepResults = useStoreValue(stepResultsStore);
  const isProcessing = useStoreValue(isProcessingStore);
  const workflowComplete = useStoreValue(workflowCompleteStore);
  const workflowData = useStoreValue(workflowDataStore);
  
  const handleStartWorkflow = useCallback(() => {
    dispatch('startWorkflow', { data: formData });
  }, [dispatch, formData]);
  
  const handleReset = useCallback(() => {
    dispatch('resetWorkflow');
  }, [dispatch]);
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/actionguard/conditional" className="text-blue-600 hover:text-blue-800 underline text-sm">
            ← Back to Conditional Patterns
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">⚡ Sequential Workflow Pattern</h1>
        <p className="text-xl text-gray-600 mb-4">
          Conditional step execution with visual progress tracking
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-purple-800">
            <strong>Conditional Workflows:</strong> This pattern shows how actions can conditionally trigger 
            subsequent steps based on previous results, creating dynamic multi-step processes.
          </p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Workflow Input</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user123"
                  disabled={isProcessing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                  disabled={isProcessing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'basic' | 'premium' | 'enterprise' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleStartWorkflow}
                  disabled={isProcessing || !formData.userId || !formData.email}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  {isProcessing ? '🔄 Processing...' : '🚀 Start Workflow'}
                </button>
                
                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  🔄 Reset
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Workflow Progress</h2>
            
            <div className="space-y-4">
              {WORKFLOW_STEPS.map((step, index) => {
                const isCurrentStep = index === currentStep;
                const isCompleted = index < currentStep || (workflowComplete && index === WORKFLOW_STEPS.length - 1);
                const stepResult = stepResults.find(r => r.step === step.id);
                
                return (
                  <div key={step.id} className={`border rounded-lg p-4 transition-colors ${
                    isCurrentStep && isProcessing 
                      ? 'border-blue-300 bg-blue-50' 
                      : isCompleted 
                        ? stepResult?.success 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isCurrentStep && isProcessing
                            ? 'bg-blue-500 text-white animate-pulse'
                            : isCompleted
                              ? stepResult?.success
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isCurrentStep && isProcessing ? '🔄' : isCompleted ? (stepResult?.success ? '✅' : '❌') : index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium">{step.name}</h3>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {stepResult && (
                          <div className="text-sm">
                            <div className={`font-medium ${stepResult.success ? 'text-green-600' : 'text-red-600'}`}>
                              {stepResult.message}
                            </div>
                            <div className="text-gray-500">
                              {new Date(stepResult.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {stepResult?.data && (
                      <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
                        <strong>Result Data:</strong> {JSON.stringify(stepResult.data, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {workflowComplete && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800">🎉 Workflow Complete!</h3>
                <p className="text-sm text-green-700 mt-1">
                  All steps completed successfully. User {workflowData?.userId} has been fully set up.
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🔍 Conditional Logic</h3>
            <div className="text-sm text-purple-800 space-y-2">
              <p><strong>Step 1:</strong> Validation conditionally proceeds only if data is valid</p>
              <p><strong>Step 2:</strong> Account setup conditionally adapts based on account type</p>
              <p><strong>Step 3:</strong> Permissions conditionally assigned based on account tier</p>
              <p><strong>Step 4:</strong> Notification conditionally sent if previous steps succeed</p>
              <p><strong>Step 5:</strong> Completion conditionally triggered when all steps pass</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkflowSteps() {
  return (
    <WorkflowActionProvider>
      <WorkflowStoreProvider>
        <WorkflowStepsContent />
      </WorkflowStoreProvider>
    </WorkflowActionProvider>
  );
}