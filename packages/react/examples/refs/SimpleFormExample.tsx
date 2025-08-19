/**
 * @fileoverview 간단한 DOM 참조 관리 예제
 * 
 * 폼 요소들의 참조 관리와 동시성 처리를 보여주는 기본 예제
 * createRefContext를 사용한 실용적인 폼 관리
 */

import React, { useCallback, useState, useEffect } from 'react';
import { createRefContext } from '../../src/refs/createRefContext';

// DOM 요소 타입 정의 (방법 1: 심플한 타입 사용)
interface FormElements {
  nameInput: HTMLInputElement;
  emailInput: HTMLInputElement;
  messageTextarea: HTMLTextAreaElement;
  submitButton: HTMLButtonElement;
  statusDiv: HTMLDivElement;
  errorDiv: HTMLDivElement;
}

// 폼 상태 타입
interface FormState {
  name: string;
  email: string;
  message: string;
  isSubmitting: boolean;
  errors: {
    name?: string;
    email?: string;
    message?: string;
  };
}

/**
 * 심플한 폼 예제 - createRefContext 방법 1 사용
 */
export function SimpleFormExample() {
  // 방법 1: 심플한 타입 지정
  const FormRefs = createRefContext<FormElements>('SimpleForm');

  function FormComponent() {
    const nameInput = FormRefs.useRefHandler('nameInput');
    const emailInput = FormRefs.useRefHandler('emailInput');
    const messageTextarea = FormRefs.useRefHandler('messageTextarea');
    const submitButton = FormRefs.useRefHandler('submitButton');
    const statusDiv = FormRefs.useRefHandler('statusDiv');
    const errorDiv = FormRefs.useRefHandler('errorDiv');
    const waitForRefs = FormRefs.useWaitForRefs();
    const getAllRefs = FormRefs.useGetAllRefs();

    const [formState, setFormState] = useState<FormState>({
      name: '',
      email: '',
      message: '',
      isSubmitting: false,
      errors: {}
    });

    // 필드 검증
    const validateField = useCallback((fieldName: keyof FormElements, value: string) => {
      let error = '';
      
      switch (fieldName) {
        case 'nameInput':
          if (value.trim().length < 2) {
            error = 'Name must be at least 2 characters';
          }
          break;
        case 'emailInput':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = 'Please enter a valid email address';
          }
          break;
        case 'messageTextarea':
          if (value.trim().length < 10) {
            error = 'Message must be at least 10 characters';
          }
          break;
      }
      
      return error;
    }, []);

    // 전체 폼 검증
    const validateForm = useCallback(async () => {
      const refs = await waitForRefs('nameInput', 'emailInput', 'messageTextarea');
      const errors: FormState['errors'] = {};
      
      if (refs.nameInput) {
        const nameError = validateField('nameInput', refs.nameInput.value);
        if (nameError) errors.name = nameError;
      }
      
      if (refs.emailInput) {
        const emailError = validateField('emailInput', refs.emailInput.value);
        if (emailError) errors.email = emailError;
      }
      
      if (refs.messageTextarea) {
        const messageError = validateField('messageTextarea', refs.messageTextarea.value);
        if (messageError) errors.message = messageError;
      }
      
      return errors;
    }, [waitForRefs, validateField]);

    // 상태 메시지 업데이트
    const updateStatus = useCallback(async (message: string, isError = false) => {
      if (statusDiv.target) {
        statusDiv.target.textContent = message;
        statusDiv.target.style.color = isError ? '#dc3545' : '#28a745';
      }
    }, [statusDiv.target]);

    // 에러 메시지 표시
    const showErrors = useCallback(async (errors: FormState['errors']) => {
      if (errorDiv.target) {
        const errorMessages = Object.values(errors).filter(Boolean);
        if (errorMessages.length > 0) {
          errorDiv.target.innerHTML = errorMessages
            .map(msg => `<div style="color: #dc3545; margin: 5px 0;">• ${msg}</div>`)
            .join('');
        } else {
          errorDiv.target.innerHTML = '';
        }
      }
    }, [errorDiv.target]);

    // 폼 제출 처리
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      await updateStatus('Validating form...', false);

      try {
        const errors = await validateForm();
        
        if (Object.keys(errors).length > 0) {
          setFormState(prev => ({ ...prev, errors, isSubmitting: false }));
          await showErrors(errors);
          await updateStatus('Please fix the errors below', true);
          return;
        }

        // 성공적인 검증 후 제출
        const refs = await waitForRefs('nameInput', 'emailInput', 'messageTextarea');
        const formData = {
          name: refs.nameInput?.value || '',
          email: refs.emailInput?.value || '',
          message: refs.messageTextarea?.value || ''
        };

        await updateStatus('Submitting form...', false);

        // 가상 API 호출 시뮬레이션
        setTimeout(async () => {
          console.log('Form submitted:', formData);
          await updateStatus('Form submitted successfully!', false);
          
          // 폼 초기화
          if (refs.nameInput) refs.nameInput.value = '';
          if (refs.emailInput) refs.emailInput.value = '';
          if (refs.messageTextarea) refs.messageTextarea.value = '';
          
          setFormState({
            name: '',
            email: '',
            message: '',
            isSubmitting: false,
            errors: {}
          });
          
          await showErrors({});
        }, 2000);

      } catch (error) {
        console.error('Form submission error:', error);
        await updateStatus('An error occurred. Please try again.', true);
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    }, [validateForm, waitForRefs, updateStatus, showErrors]);

    // 실시간 필드 검증
    const handleFieldChange = useCallback((fieldName: keyof FormElements) => {
      return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        const error = validateField(fieldName, value);
        
        setFormState(prev => ({
          ...prev,
          [fieldName.replace('Input', '').replace('Textarea', '')]: value,
          errors: {
            ...prev.errors,
            [fieldName.replace('Input', '').replace('Textarea', '')]: error || undefined
          }
        }));
      };
    }, [validateField]);

    // 첫 번째 필드에 자동 포커스
    const focusFirstField = useCallback(async () => {
      try {
        const nameEl = await nameInput.waitForMount();
        nameEl.focus();
      } catch (error) {
        console.error('Failed to focus first field:', error);
      }
    }, [nameInput]);

    // 컴포넌트 마운트 시 포커스
    useEffect(() => {
      if (nameInput.isMounted) {
        focusFirstField();
      }
    }, [nameInput.isMounted, focusFirstField]);

    // 디버그: 모든 ref 상태 로그
    const logAllRefs = useCallback(() => {
      const allRefs = getAllRefs();
      console.log('All form refs:', allRefs);
      console.log('Mount states:', {
        nameInput: nameInput.isMounted,
        emailInput: emailInput.isMounted,
        messageTextarea: messageTextarea.isMounted,
        submitButton: submitButton.isMounted,
        statusDiv: statusDiv.isMounted,
        errorDiv: errorDiv.isMounted
      });
    }, [getAllRefs, nameInput, emailInput, messageTextarea, submitButton, statusDiv, errorDiv]);

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h2>Simple Form Example</h2>
        <p>Demonstrates createRefContext with form elements and validation</p>

        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Name:
            </label>
            <input
              ref={nameInput.setRef}
              type="text"
              placeholder="Enter your name"
              onChange={handleFieldChange('nameInput')}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                borderColor: formState.errors.name ? '#dc3545' : '#ddd'
              }}
            />
            {formState.errors.name && (
              <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                {formState.errors.name}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email:
            </label>
            <input
              ref={emailInput.setRef}
              type="email"
              placeholder="Enter your email"
              onChange={handleFieldChange('emailInput')}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                borderColor: formState.errors.email ? '#dc3545' : '#ddd'
              }}
            />
            {formState.errors.email && (
              <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                {formState.errors.email}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Message:
            </label>
            <textarea
              ref={messageTextarea.setRef}
              placeholder="Enter your message"
              rows={4}
              onChange={handleFieldChange('messageTextarea')}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                borderColor: formState.errors.message ? '#dc3545' : '#ddd',
                resize: 'vertical'
              }}
            />
            {formState.errors.message && (
              <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                {formState.errors.message}
              </div>
            )}
          </div>

          <button
            ref={submitButton.setRef}
            type="submit"
            disabled={formState.isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: formState.isSubmitting ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: formState.isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {formState.isSubmitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </form>

        {/* 상태 및 에러 표시 영역 */}
        <div ref={statusDiv.setRef} style={{ 
          padding: '10px', 
          marginBottom: '10px',
          minHeight: '20px',
          fontWeight: 'bold'
        }} />
        
        <div ref={errorDiv.setRef} style={{ marginBottom: '20px' }} />

        {/* 디버그 정보 */}
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4>Debug Information</h4>
          <button 
            onClick={logAllRefs}
            style={{ 
              padding: '5px 10px', 
              marginBottom: '10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Log All Refs
          </button>
          
          <div style={{ fontSize: '12px', color: '#666' }}>
            <p><strong>Mount States:</strong></p>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Name Input: {nameInput.isMounted ? '✅' : '⏳'}</li>
              <li>Email Input: {emailInput.isMounted ? '✅' : '⏳'}</li>
              <li>Message Textarea: {messageTextarea.isMounted ? '✅' : '⏳'}</li>
              <li>Submit Button: {submitButton.isMounted ? '✅' : '⏳'}</li>
              <li>Status Div: {statusDiv.isMounted ? '✅' : '⏳'}</li>
              <li>Error Div: {errorDiv.isMounted ? '✅' : '⏳'}</li>
            </ul>
            
            <p><strong>Form State:</strong></p>
            <pre style={{ fontSize: '10px', background: 'white', padding: '10px', borderRadius: '3px' }}>
              {JSON.stringify(formState, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormRefs.Provider>
      <FormComponent />
    </FormRefs.Provider>
  );
}

export default SimpleFormExample;