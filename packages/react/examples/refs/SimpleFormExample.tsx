/**
 * @fileoverview 간단한 DOM 참조 관리 예제
 * 
 * 폼 요소들의 참조 관리와 동시성 처리를 보여주는 기본 예제
 */

import React, { useCallback, useState } from 'react';
import { createRefContext } from '../../src/refs/createRefContext';
import type { RefActionPayloadMap, RefInitConfig } from '../../src/refs/types';

// DOM 요소 타입 정의
interface FormElements {
  nameInput: HTMLInputElement;
  emailInput: HTMLInputElement;
  messageTextarea: HTMLTextAreaElement;
  submitButton: HTMLButtonElement;
  statusDiv: HTMLDivElement;
  errorDiv: HTMLDivElement;
}

// 폼 액션 정의
interface FormActions extends RefActionPayloadMap {
  validateField: { 
    fieldName: keyof FormElements;
    value: string;
  };
  submitForm: {
    name: string;
    email: string;
    message: string;
  };
  showError: { message: string };
  showSuccess: { message: string };
  clearMessages: void;
  focusField: { fieldName: keyof FormElements };
  resetForm: void;
}

// DOM RefContext 생성
const formRefDefinitions = {
  nameInput: {
    name: 'nameInput',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLInputElement>,
  
  emailInput: {
    name: 'emailInput',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLInputElement>,
  
  messageTextarea: {
    name: 'messageTextarea',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLTextAreaElement>,
  
  submitButton: {
    name: 'submitButton',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLButtonElement>,
  
  statusDiv: {
    name: 'statusDiv',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLDivElement>,
  
  errorDiv: {
    name: 'errorDiv',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLDivElement>
};

const FormRefs = createRefContext<typeof formRefDefinitions, FormActions>('ContactForm', formRefDefinitions);

/**
 * 폼 로직 컴포넌트
 */
function FormLogic() {
  // 필드 검증 핸들러
  FormRefs.useRefActionHandler('validateField', async ({ fieldName, value }, { refContext }) => {
    console.log(`🔍 Validating ${fieldName}: ${value}`);

    let isValid = true;
    let errorMessage = '';

    // 검증 로직
    switch (fieldName) {
      case 'nameInput':
        isValid = value.trim().length >= 2;
        errorMessage = isValid ? '' : 'Name must be at least 2 characters';
        break;
      case 'emailInput':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        errorMessage = isValid ? '' : 'Please enter a valid email address';
        break;
      case 'messageTextarea':
        isValid = value.trim().length >= 10;
        errorMessage = isValid ? '' : 'Message must be at least 10 characters';
        break;
    }

    // UI 업데이트
    await refContext.withRef(fieldName, (element) => {
      element.style.borderColor = isValid ? '#28a745' : '#dc3545';
      element.style.borderWidth = '2px';
      element.setAttribute('data-valid', isValid.toString());
    });

    if (!isValid) {
      await refContext.withRef('errorDiv', (div) => {
        div.textContent = errorMessage;
        div.style.color = '#dc3545';
        div.style.display = 'block';
      });
    } else {
      await refContext.withRef('errorDiv', (div) => {
        div.style.display = 'none';
      });
    }
  });

  // 폼 제출 핸들러
  FormRefs.useRefActionHandler('submitForm', async ({ name, email, message }, { refContext }) => {
    console.log('📝 Submitting form:', { name, email, message });

    try {
      // 제출 버튼 비활성화
      await refContext.withRef('submitButton', (button) => {
        button.disabled = true;
        button.textContent = 'Submitting...';
      });

      // 상태 메시지 표시
      await refContext.withRef('statusDiv', (div) => {
        div.textContent = 'Submitting your message...';
        div.style.color = '#007bff';
        div.style.display = 'block';
      });

      // 가상의 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 성공 메시지
      await refContext.withRef('statusDiv', (div) => {
        div.textContent = '✅ Message sent successfully!';
        div.style.color = '#28a745';
      });

      // 폼 리셋
      await refContext.withRefs(['nameInput', 'emailInput', 'messageTextarea'], (refs) => {
        Object.values(refs).forEach(element => {
          if (element && 'value' in element) {
            (element as HTMLInputElement | HTMLTextAreaElement).value = '';
            element.style.borderColor = '';
            element.style.borderWidth = '';
          }
        });
      });

    } catch (error) {
      // 에러 메시지
      await refContext.withRef('statusDiv', (div) => {
        div.textContent = '❌ Failed to send message. Please try again.';
        div.style.color = '#dc3545';
      });
    } finally {
      // 제출 버튼 활성화
      await refContext.withRef('submitButton', (button) => {
        button.disabled = false;
        button.textContent = 'Send Message';
      });
    }
  });

  // 에러 표시 핸들러
  FormRefs.useRefActionHandler('showError', async ({ message }, { refContext }) => {
    await refContext.withRef('errorDiv', (div) => {
      div.textContent = message;
      div.style.color = '#dc3545';
      div.style.display = 'block';
    });
  });

  // 성공 표시 핸들러
  FormRefs.useRefActionHandler('showSuccess', async ({ message }, { refContext }) => {
    await refContext.withRef('statusDiv', (div) => {
      div.textContent = message;
      div.style.color = '#28a745';
      div.style.display = 'block';
    });
  });

  // 메시지 지우기 핸들러
  FormRefs.useRefActionHandler('clearMessages', async (_, { refContext }) => {
    await refContext.withRefs(['statusDiv', 'errorDiv'], (refs) => {
      Object.values(refs).forEach(element => {
        if (element) {
          element.style.display = 'none';
          element.textContent = '';
        }
      });
    });
  });

  // 필드 포커스 핸들러
  FormRefs.useRefActionHandler('focusField', async ({ fieldName }, { refContext }) => {
    await refContext.withRef(fieldName, (element) => {
      if ('focus' in element) {
        (element as HTMLInputElement | HTMLTextAreaElement).focus();
      }
    });
  });

  // 폼 리셋 핸들러
  FormRefs.useRefActionHandler('resetForm', async (_, { refContext }) => {
    await refContext.withRefs(
      ['nameInput', 'emailInput', 'messageTextarea', 'submitButton', 'statusDiv', 'errorDiv'],
      (refs) => {
        // 입력 필드 리셋
        ['nameInput', 'emailInput', 'messageTextarea'].forEach(fieldName => {
          const element = refs[fieldName as keyof typeof refs];
          if (element && 'value' in element) {
            (element as HTMLInputElement | HTMLTextAreaElement).value = '';
            element.style.borderColor = '';
            element.style.borderWidth = '';
            element.removeAttribute('data-valid');
          }
        });

        // 버튼 리셋
        if (refs.submitButton) {
          refs.submitButton.disabled = false;
          refs.submitButton.textContent = 'Send Message';
        }

        // 메시지 지우기
        [refs.statusDiv, refs.errorDiv].forEach(element => {
          if (element) {
            element.style.display = 'none';
            element.textContent = '';
          }
        });
      }
    );
  });

  return null;
}

/**
 * 연락처 폼 컴포넌트
 */
function ContactForm() {
  const nameInput = FormRefs.useRef('nameInput');
  const emailInput = FormRefs.useRef('emailInput');
  const messageTextarea = FormRefs.useRef('messageTextarea');
  const submitButton = FormRefs.useRef('submitButton');
  const statusDiv = FormRefs.useRef('statusDiv');
  const errorDiv = FormRefs.useRef('errorDiv');
  
  const dispatch = FormRefs.useRefAction();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // 입력 값 변경 처리
  const handleInputChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 실시간 검증
    const fieldNames = {
      name: 'nameInput',
      email: 'emailInput', 
      message: 'messageTextarea'
    } as const;
    
    dispatch('validateField', {
      fieldName: fieldNames[field] as keyof FormElements,
      value
    });
  }, [dispatch]);

  // 폼 제출 처리
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // 빈 필드 체크
    if (!formData.name.trim()) {
      dispatch('focusField', { fieldName: 'nameInput' });
      dispatch('showError', { message: 'Please enter your name' });
      return;
    }
    
    if (!formData.email.trim()) {
      dispatch('focusField', { fieldName: 'emailInput' });
      dispatch('showError', { message: 'Please enter your email' });
      return;
    }
    
    if (!formData.message.trim()) {
      dispatch('focusField', { fieldName: 'messageTextarea' });
      dispatch('showError', { message: 'Please enter your message' });
      return;
    }

    // 메시지 지우고 폼 제출
    dispatch('clearMessages');
    dispatch('submitForm', formData);
  }, [dispatch, formData]);

  // 폼 리셋
  const handleReset = useCallback(() => {
    setFormData({ name: '', email: '', message: '' });
    dispatch('resetForm');
  }, [dispatch]);

  // 필드에 포커스
  const handleFieldFocus = useCallback((fieldName: keyof FormElements) => {
    dispatch('focusField', { fieldName });
  }, [dispatch]);

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <h2>Contact Form Example</h2>
      <p>이 예제는 DOM 참조를 안전하게 관리하고 동시성 문제를 해결하는 방법을 보여줍니다.</p>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Name *
          </label>
          <input
            ref={nameInput.setRef}
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            placeholder="Enter your name"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email *
          </label>
          <input
            ref={emailInput.setRef}
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            placeholder="Enter your email"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="message" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Message *
          </label>
          <textarea
            ref={messageTextarea.setRef}
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              resize: 'vertical'
            }}
            placeholder="Enter your message"
          />
        </div>

        {/* 에러 메시지 */}
        <div
          ref={errorDiv.setRef}
          style={{
            display: 'none',
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24'
          }}
        />

        {/* 상태 메시지 */}
        <div
          ref={statusDiv.setRef}
          style={{
            display: 'none',
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#d1ecf1',
            border: '1px solid #bee5eb',
            borderRadius: '4px'
          }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            ref={submitButton.setRef}
            type="submit"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Send Message
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset Form
          </button>
        </div>
      </form>

      {/* 개발자 도구 */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>Developer Tools</h4>
        <p style={{ marginBottom: '15px', fontSize: '14px', color: '#6c757d' }}>
          이 버튼들로 RefContext의 기능을 테스트해보세요:
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => handleFieldFocus('nameInput')}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Focus Name
          </button>
          
          <button
            onClick={() => handleFieldFocus('emailInput')}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Focus Email
          </button>
          
          <button
            onClick={() => handleFieldFocus('messageTextarea')}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Focus Message
          </button>
          
          <button
            onClick={() => dispatch('showError', { message: 'This is a test error message' })}
            style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}
          >
            Show Error
          </button>
          
          <button
            onClick={() => dispatch('showSuccess', { message: 'This is a test success message' })}
            style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#28a745', color: 'white', border: 'none' }}
          >
            Show Success
          </button>
          
          <button
            onClick={() => dispatch('clearMessages')}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Clear Messages
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 메인 앱 컴포넌트
 */
export function FormApp() {
  return (
    <FormRefs.Provider>
      <FormLogic />
      <ContactForm />
    </FormRefs.Provider>
  );
}

export default FormApp;