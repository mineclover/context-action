/**
 * Action domain contexts
 * Centralized action context definitions for the Action domain
 */

import { createActionContext } from '@context-action/react';
import type { ActionPayloadMap } from '../../shared/types';

// Demo User Action Context - for user-related action demonstrations
interface DemoUserActions extends ActionPayloadMap {
  updateProfile: { 
    field: 'name' | 'email' | 'avatar';
    value: string;
  };
  updatePreferences: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    language?: 'en' | 'ko' | 'ja' | 'zh';
  };
  resetProfile: void;
  validateProfile: void;
  saveProfile: void;
  loadProfile: { userId?: string };
}

export const {
  Provider: DemoUserActionProvider,
  useActionDispatch: useDemoUserActionDispatch,
  useActionHandler: useDemoUserActionHandler,
} = createActionContext<DemoUserActions>('DemoUserActions');

// Demo Shopping Action Context - for e-commerce action demonstrations  
interface DemoShoppingActions extends ActionPayloadMap {
  addToCart: {
    productId: string;
    quantity?: number;
  };
  removeFromCart: {
    productId: string;
  };
  updateCartQuantity: {
    productId: string;
    quantity: number;
  };
  applyCoupon: {
    couponCode: string;
  };
  removeCoupon: void;
  calculateTotal: void;
  proceedToCheckout: void;
  updateShipping: {
    method: 'standard' | 'express' | 'overnight';
    cost: number;
  };
  processPayment: {
    paymentMethod: 'credit' | 'debit' | 'paypal';
    amount: number;
  };
  completeOrder: void;
}

export const {
  Provider: DemoShoppingActionProvider,
  useActionDispatch: useDemoShoppingActionDispatch,
  useActionHandler: useDemoShoppingActionHandler,
} = createActionContext<DemoShoppingActions>('DemoShoppingActions');

// Demo Workflow Action Context - for business workflow demonstrations
interface DemoWorkflowActions extends ActionPayloadMap {
  startWorkflow: {
    workflowType: 'approval' | 'review' | 'processing';
    data: any;
  };
  approveStep: {
    stepId: string;
    comments?: string;
  };
  rejectStep: {
    stepId: string;
    reason: string;
  };
  assignTask: {
    taskId: string;
    assigneeId: string;
  };
  completeTask: {
    taskId: string;
    result: any;
  };
  escalateTask: {
    taskId: string;
    escalationLevel: number;
  };
  cancelWorkflow: {
    workflowId: string;
    reason: string;
  };
}

export const {
  Provider: DemoWorkflowActionProvider,
  useActionDispatch: useDemoWorkflowActionDispatch,
  useActionHandler: useDemoWorkflowActionHandler,
} = createActionContext<DemoWorkflowActions>('DemoWorkflowActions');

// Demo Performance Action Context - for performance testing demonstrations
interface DemoPerformanceActions extends ActionPayloadMap {
  startBenchmark: {
    testName: string;
    iterations: number;
  };
  recordMetric: {
    metric: string;
    value: number;
    timestamp?: number;
  };
  startOperation: {
    operationName: string;
  };
  endOperation: {
    operationName: string;
    success: boolean;
    duration?: number;
  };
  generateLoad: {
    actionCount: number;
    concurrency: number;
  };
  measureMemory: void;
  clearMetrics: void;
  exportResults: {
    format: 'json' | 'csv' | 'report';
  };
}

export const {
  Provider: DemoPerformanceActionProvider,
  useActionDispatch: useDemoPerformanceActionDispatch,
  useActionHandler: useDemoPerformanceActionHandler,
} = createActionContext<DemoPerformanceActions>('DemoPerformanceActions');

// Demo API Action Context - for API interaction demonstrations
interface DemoApiActions extends ActionPayloadMap {
  fetchUsers: {
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
  };
  createUser: {
    userData: {
      name: string;
      email: string;
      role: string;
    };
  };
  updateUser: {
    userId: string;
    updates: Partial<{
      name: string;
      email: string;
      role: string;
    }>;
  };
  deleteUser: {
    userId: string;
  };
  uploadFile: {
    file: File;
    category: string;
  };
  downloadFile: {
    fileId: string;
  };
  syncData: void;
  retryFailedRequest: {
    requestId: string;
  };
}

export const {
  Provider: DemoApiActionProvider,
  useActionDispatch: useDemoApiActionDispatch,
  useActionHandler: useDemoApiActionHandler,
} = createActionContext<DemoApiActions>('DemoApiActions');

// Demo Form Action Context - for form handling demonstrations
interface DemoFormActions extends ActionPayloadMap {
  initializeForm: {
    formType: string;
    initialData?: Record<string, any>;
  };
  updateField: {
    fieldName: string;
    value: any;
  };
  validateField: {
    fieldName: string;
  };
  validateForm: void;
  submitForm: {
    formData: Record<string, any>;
  };
  resetForm: void;
  saveAsDraft: void;
  loadDraft: {
    draftId?: string;
  };
  setFieldError: {
    fieldName: string;
    error: string | null;
  };
  clearErrors: void;
}

export const {
  Provider: DemoFormActionProvider,
  useActionDispatch: useDemoFormActionDispatch,
  useActionHandler: useDemoFormActionHandler,
} = createActionContext<DemoFormActions>('DemoFormActions');

// Export all action contexts for easy access
export const ActionContexts = {
  DemoUser: {
    Provider: DemoUserActionProvider,
    useActionDispatch: useDemoUserActionDispatch,
    useActionHandler: useDemoUserActionHandler,
  },
  DemoShopping: {
    Provider: DemoShoppingActionProvider,
    useActionDispatch: useDemoShoppingActionDispatch,
    useActionHandler: useDemoShoppingActionHandler,
  },
  DemoWorkflow: {
    Provider: DemoWorkflowActionProvider,
    useActionDispatch: useDemoWorkflowActionDispatch,
    useActionHandler: useDemoWorkflowActionHandler,
  },
  DemoPerformance: {
    Provider: DemoPerformanceActionProvider,
    useActionDispatch: useDemoPerformanceActionDispatch,
    useActionHandler: useDemoPerformanceActionHandler,
  },
  DemoApi: {
    Provider: DemoApiActionProvider,
    useActionDispatch: useDemoApiActionDispatch,
    useActionHandler: useDemoApiActionHandler,
  },
  DemoForm: {
    Provider: DemoFormActionProvider,
    useActionDispatch: useDemoFormActionDispatch,
    useActionHandler: useDemoFormActionHandler,
  }
};

// Export action type definitions for external use
export type {
  DemoUserActions,
  DemoShoppingActions,
  DemoWorkflowActions,
  DemoPerformanceActions,
  DemoApiActions,
  DemoFormActions
};