import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createActionContext, createStoreContext, useStoreValue } from '@context-action/react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationActions {
  validateField: { field: keyof FormData; value: string };
  validateForm: { formData: FormData };
  submitForm: { formData: FormData };
}

const { Provider: ValidationActionProvider, useActionDispatch: useValidationAction, useActionHandler: useValidationHandler } = createActionContext<ValidationActions>('FormValidation');

const { Provider: FormStoreProvider, useStore: useFormStore } = createStoreContext('FormValidation', {
  formData: { initialValue: { email: '', password: '', confirmPassword: '' } as FormData },
  fieldErrors: { initialValue: {} as Record<keyof FormData, string> },
  isValid: { initialValue: false },
  isSubmitting: { initialValue: false },
  submitResult: { initialValue: null as string | null }
});

function FormValidationContent() {
  const dispatch = useValidationAction();
  
  const formDataStore = useFormStore('formData');
  const fieldErrorsStore = useFormStore('fieldErrors');
  const isValidStore = useFormStore('isValid');
  const isSubmittingStore = useFormStore('isSubmitting');
  const submitResultStore = useFormStore('submitResult');
  
  const [formData, setFormData] = useState<FormData>({ email: '', password: '', confirmPassword: '' });
  
  useValidationHandler('validateField', useCallback(async (payload, controller) => {
    const { field, value } = payload;
    let error = '';
    
    if (field === 'email') {
      if (!value) {
        error = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Invalid email format';
      }
    } else if (field === 'password') {
      if (!value) {
        error = 'Password is required';
      } else if (value.length < 8) {
        error = 'Password must be at least 8 characters';
      }
    } else if (field === 'confirmPassword') {
      const currentForm = formDataStore.getValue();
      if (!value) {
        error = 'Please confirm your password';
      } else if (value !== currentForm.password) {
        error = 'Passwords do not match';
      }
    }
    
    const currentErrors = fieldErrorsStore.getValue();
    fieldErrorsStore.setValue({
      ...currentErrors,
      [field]: error
    });
    
    
    const updatedErrors = { ...currentErrors, [field]: error };
    const hasErrors = Object.values(updatedErrors).some(err => err !== '');
    isValidStore.setValue(!hasErrors);
  }, [formDataStore, fieldErrorsStore, isValidStore]));
  
  useValidationHandler('validateForm', useCallback(async (payload, controller) => {
    const { formData } = payload;
    
    await dispatch('validateField', { field: 'email', value: formData.email });
    await dispatch('validateField', { field: 'password', value: formData.password });
    await dispatch('validateField', { field: 'confirmPassword', value: formData.confirmPassword });
    
    const errors = fieldErrorsStore.getValue();
      const _isFormValid = !Object.values(errors).some(err => err !== '');
    
  }, [dispatch, fieldErrorsStore]));
  
  useValidationHandler('submitForm', useCallback(async (payload, controller) => {
    const { formData } = payload;
    
    isSubmittingStore.setValue(true);
    submitResultStore.setValue(null);
    
    await dispatch('validateForm', { formData });
    
    const errors = fieldErrorsStore.getValue();
      const _isFormValid = !Object.values(errors).some(err => err !== '');
    
    if (!_isFormValid) {
      controller.abort('Form validation failed');
      isSubmittingStore.setValue(false);
      return;
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (Math.random() < 0.8) {
        submitResultStore.setValue('✅ Account created successfully!');
      } else {
        throw new Error('Email already exists');
      }
    } catch (error) {
      submitResultStore.setValue(`❌ ${error instanceof Error ? error.message : 'Submission failed'}`);
    } finally {
      isSubmittingStore.setValue(false);
    }
  }, [dispatch, isSubmittingStore, submitResultStore]));
  
  const fieldErrors = useStoreValue(fieldErrorsStore);
  const isValid = useStoreValue(isValidStore);
  const isSubmitting = useStoreValue(isSubmittingStore);
  const submitResult = useStoreValue(submitResultStore);
  
  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    formDataStore.setValue(newFormData);
    
    dispatch('validateField', { field, value });
  }, [formData, formDataStore, dispatch]);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    dispatch('submitForm', { formData });
  }, [dispatch, formData]);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/actionguard/conditional" className="text-blue-600 hover:text-blue-800 underline text-sm">
            ← Back to Conditional Patterns
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">📝 Form Validation Pattern</h1>
        <p className="text-xl text-gray-600 mb-4">
          Real-time conditional validation with clear visual feedback
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-800">
            <strong>Conditional Validation:</strong> This pattern demonstrates how actions can conditionally execute 
            based on validation results, with immediate feedback and state visualization.
          </p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Registration Form</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    fieldErrors.email 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="user@example.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">❌ {fieldErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    fieldErrors.password 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Minimum 8 characters"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">❌ {fieldErrors.password}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    fieldErrors.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Repeat your password"
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">❌ {fieldErrors.confirmPassword}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  isValid && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? '🔄 Creating Account...' : 'Create Account'}
              </button>
            </form>
            
            {submitResult && (
              <div className={`mt-4 p-3 rounded-md ${
                submitResult.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {submitResult}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Validation State</h3>
            
            <div className="space-y-3">
              <div className={`p-3 rounded-md ${isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Form Status</span>
                  <span className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isValid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Field Validation</h4>
                {Object.entries(fieldErrors).map(([field, error]) => (
                  <div key={field} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{field}:</span>
                    <span className={error ? 'text-red-600' : 'text-green-600'}>
                      {error ? '❌ Error' : '✅ Valid'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className={`p-2 rounded text-sm ${isSubmitting ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                Submit Status: {isSubmitting ? '🔄 Processing' : '⏸️ Ready'}
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🔍 How It Works</h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li>
                <span className="font-semibold text-yellow-600">1.</span>
                <span className="ml-2">Type in any field to trigger real-time validation</span>
              </li>
              <li>
                <span className="font-semibold text-yellow-600">2.</span>
                <span className="ml-2">Action handlers conditionally validate based on field rules</span>
              </li>
              <li>
                <span className="font-semibold text-yellow-600">3.</span>
                <span className="ml-2">Submit button is conditionally enabled only when form is valid</span>
              </li>
              <li>
                <span className="font-semibold text-yellow-600">4.</span>
                <span className="ml-2">Submit action conditionally executes based on final validation</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormValidation() {
  return (
    <ValidationActionProvider>
      <FormStoreProvider>
        <FormValidationContent />
      </FormStoreProvider>
    </ValidationActionProvider>
  );
}