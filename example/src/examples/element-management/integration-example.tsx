/**
 * @fileoverview Integration Example - Real-world Element Management
 * Context-Action 프레임워크를 활용한 실제 사용 시나리오 예제
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  ElementManagementProvider,
  useElementRef,
  useElementManager,
  useFocusedElement,
  useElementSelection,
  useElementsByType,
  ManagedInput,
  ManagedButton,
  ElementDebugPanel
} from './react-element-hooks';
import { AdvancedCanvasExample } from './advanced-canvas-example';

// 실제 애플리케이션 시나리오: Form Builder
export function FormBuilderExample() {
  return (
    <ElementManagementProvider>
      <div className="p-5">
        <h1 className="text-3xl font-bold mb-4">Form Builder - Element Management Example</h1>
        <FormBuilderApp />
        <ElementDebugPanel />
      </div>
    </ElementManagementProvider>
  );
}

function FormBuilderApp() {
  const [formFields, setFormFields] = useState<Array<{
    id: string;
    type: 'text' | 'email' | 'password' | 'textarea';
    label: string;
    required: boolean;
  }>>([
    { id: 'name', type: 'text', label: 'Name', required: true },
    { id: 'email', type: 'email', label: 'Email', required: true },
    { id: 'message', type: 'textarea', label: 'Message', required: false }
  ]);

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex gap-5">
      {/* Form Preview */}
      <div className="flex-1">
        <h2 className="text-2xl font-semibold mb-4">Form Preview</h2>
        <FormPreview fields={formFields} />
      </div>

      {/* Form Builder Controls */}
      <div className="flex-1">
        <h2 className="text-2xl font-semibold mb-4">Form Builder Controls</h2>
        <FormBuilderControls 
          fields={formFields} 
          onFieldsChange={setFormFields}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        />
      </div>
    </div>
  );
}

// Form Preview Component
function FormPreview({ fields }: { 
  fields: Array<{ id: string; type: string; label: string; required: boolean }> 
}) {
  const { focusedElementId, focusElement } = useFocusedElement();
  const { selectedElements, selectElement, isSelected, toggleElement } = useElementSelection();

  const handleFieldClick = useCallback((fieldId: string, event: React.MouseEvent) => {
    event.preventDefault();
    
    if (event.metaKey || event.ctrlKey) {
      // Multi-select with Cmd/Ctrl
      toggleElement(fieldId);
    } else {
      // Single select
      selectElement(fieldId);
      focusElement(fieldId);
    }
  }, [selectElement, focusElement, toggleElement]);

  return (
    <form className="border border-gray-300 p-5 rounded-lg bg-gray-50">
      {fields.map(field => (
        <FormField
          key={field.id}
          field={field}
          isFocused={focusedElementId === field.id}
          isSelected={isSelected(field.id)}
          onClick={handleFieldClick}
        />
      ))}
      
      <ManagedButton
        elementId="submit-btn"
        metadata={{ formRole: 'submit', category: 'action' }}
        type="submit"
        className={`mt-4 px-5 py-2 rounded cursor-pointer border-none text-white ${
          isSelected('submit-btn') ? 'bg-green-500' : 'bg-blue-500'
        }`}
      >
        Submit Form
      </ManagedButton>
    </form>
  );
}

// Individual Form Field Component
function FormField({ 
  field, 
  isFocused, 
  isSelected, 
  onClick 
}: {
  field: { id: string; type: string; label: string; required: boolean };
  isFocused: boolean;
  isSelected: boolean;
  onClick: (fieldId: string, event: React.MouseEvent) => void;
}) {
  const fieldStyle = `
    mb-4 p-3 rounded cursor-pointer border-2 
    ${isSelected ? 'border-green-500 bg-green-50' : isFocused ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
  `;

  const inputMetadata = {
    formField: true,
    fieldType: field.type,
    required: field.required,
    label: field.label
  };

  return (
    <div 
      className={fieldStyle}
      onClick={(e) => onClick(field.id, e)}
    >
      <label className="block mb-1 font-semibold">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      
      {field.type === 'textarea' ? (
        <ManagedTextarea
          elementId={field.id}
          metadata={inputMetadata}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
          required={field.required}
        />
      ) : (
        <ManagedInput
          elementId={field.id}
          metadata={inputMetadata}
          type={field.type}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
          required={field.required}
          className="w-full p-2 border border-gray-300 rounded"
        />
      )}
    </div>
  );
}

// Managed Textarea Component (similar to ManagedInput)
const ManagedTextarea = React.forwardRef<HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { 
    elementId: string; 
    metadata?: Record<string, any> 
  }
>(({ elementId, metadata, ...textareaProps }, forwardedRef) => {
  const elementRef = useElementRef(elementId, 'input', metadata); // Using 'input' type for form inputs
  
  const combinedRef = useCallback((element: HTMLTextAreaElement | null) => {
    elementRef(element);
    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }, [elementRef, forwardedRef]);

  return (
    <textarea 
      {...textareaProps} 
      ref={combinedRef}
      className="w-full min-h-20 p-2 border border-gray-300 rounded"
    />
  );
});

// Form Builder Controls
function FormBuilderControls({ 
  fields, 
  onFieldsChange, 
  showAdvanced,
  onToggleAdvanced 
}: {
  fields: any[];
  onFieldsChange: (fields: any[]) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}) {
  const { selectedElements, clearSelection } = useElementSelection();
  const inputElements = useElementsByType('input');
  const buttonElements = useElementsByType('button');
  const { focusedElementId, focusElement } = useFocusedElement();

  const addField = useCallback((type: string) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false
    };
    onFieldsChange([...fields, newField]);
  }, [fields, onFieldsChange]);

  const removeSelectedFields = useCallback(() => {
    const remainingFields = fields.filter(field => !selectedElements.includes(field.id));
    onFieldsChange(remainingFields);
    clearSelection();
  }, [fields, selectedElements, onFieldsChange, clearSelection]);

  const buttonClass = "px-3 py-2 bg-blue-500 text-white rounded cursor-pointer text-sm border-none";

  return (
    <div className="border border-gray-300 p-5 rounded-lg bg-gray-50">
      {/* Add Field Controls */}
      <div className="mb-5">
        <h3 className="text-xl font-semibold mb-2">Add Fields</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => addField('text')} className={buttonClass}>
            + Text Field
          </button>
          <button onClick={() => addField('email')} className={buttonClass}>
            + Email Field
          </button>
          <button onClick={() => addField('password')} className={buttonClass}>
            + Password Field
          </button>
          <button onClick={() => addField('textarea')} className={buttonClass}>
            + Textarea
          </button>
        </div>
      </div>

      {/* Selection Controls */}
      {selectedElements.length > 0 && (
        <div className="mb-5 p-3 bg-blue-50 rounded">
          <h3 className="text-lg font-semibold mb-2">Selection Actions</h3>
          <p className="mb-2">{selectedElements.length} element(s) selected: {selectedElements.join(', ')}</p>
          <div className="flex gap-2">
            <button 
              onClick={removeSelectedFields} 
              className="px-3 py-2 bg-red-500 text-white rounded cursor-pointer text-sm border-none"
            >
              Remove Selected
            </button>
            <button onClick={clearSelection} className={buttonClass}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Element Statistics */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold mb-2">Element Statistics</h3>
        <div className="text-sm space-y-1">
          <div>📝 Input Elements: {inputElements.length}</div>
          <div>🔘 Button Elements: {buttonElements.length}</div>
          <div>🎯 Focused Element: {focusedElementId || 'None'}</div>
          <div>✅ Selected Elements: {selectedElements.length}</div>
        </div>
      </div>

      {/* Advanced Controls */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Advanced Controls
          <button 
            onClick={onToggleAdvanced}
            className="ml-2 px-2 py-1 bg-gray-500 text-white rounded cursor-pointer text-xs border-none"
          >
            {showAdvanced ? 'Hide' : 'Show'}
          </button>
        </h3>
        
        {showAdvanced && (
          <div className="border border-gray-200 p-3 rounded bg-white">
            <ElementInspector />
            <KeyboardShortcuts />
          </div>
        )}
      </div>
    </div>
  );
}

// Element Inspector Component
function ElementInspector() {
  const { selectedElements } = useElementSelection();
  const { getElement } = useElementManager();

  if (selectedElements.length === 0) {
    return <div className="text-sm text-gray-600 mb-4">Select an element to inspect</div>;
  }

  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Element Inspector</h4>
      {selectedElements.map(id => {
        const elementInfo = getElement(id);
        if (!elementInfo) return null;

        return (
          <div key={id} className="text-xs font-mono bg-gray-100 p-2 mb-2 rounded">
            <div><strong>ID:</strong> {elementInfo.id}</div>
            <div><strong>Type:</strong> {elementInfo.type}</div>
            <div><strong>Created:</strong> {new Date(elementInfo.createdAt).toLocaleTimeString()}</div>
            {elementInfo.lastAccessed && (
              <div><strong>Last Accessed:</strong> {new Date(elementInfo.lastAccessed).toLocaleTimeString()}</div>
            )}
            {elementInfo.metadata && Object.keys(elementInfo.metadata).length > 0 && (
              <div><strong>Metadata:</strong> {JSON.stringify(elementInfo.metadata, null, 2)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Keyboard Shortcuts Guide
function KeyboardShortcuts() {
  const { focusElement } = useFocusedElement();
  const inputElements = useElementsByType('input');

  const focusFirstInput = useCallback(() => {
    if (inputElements.length > 0) {
      focusElement(inputElements[0].id);
    }
  }, [inputElements, focusElement]);

  const focusLastInput = useCallback(() => {
    if (inputElements.length > 0) {
      focusElement(inputElements[inputElements.length - 1].id);
    }
  }, [inputElements, focusElement]);

  // Keyboard shortcuts handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'Home' && event.ctrlKey) {
        event.preventDefault();
        focusFirstInput();
      } else if (event.key === 'End' && event.ctrlKey) {
        event.preventDefault();
        focusLastInput();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusFirstInput, focusLastInput]);

  const shortcutButtonClass = "px-2 py-1 bg-blue-500 text-white rounded cursor-pointer text-xs border-none mr-1";

  return (
    <div>
      <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
      <div className="text-xs space-y-1 mb-2">
        <div>• Click: Select element</div>
        <div>• Cmd/Ctrl + Click: Multi-select</div>
        <div>• Ctrl + Home: Focus first input</div>
        <div>• Ctrl + End: Focus last input</div>
      </div>
      <div>
        <button onClick={focusFirstInput} className={shortcutButtonClass}>
          Focus First Input
        </button>
        <button onClick={focusLastInput} className={shortcutButtonClass}>
          Focus Last Input
        </button>
      </div>
    </div>
  );
}

// Canvas Management Example (Advanced scenario)
export function CanvasManagementExample() {
  return (
    <ElementManagementProvider>
      <AdvancedCanvasExample />
    </ElementManagementProvider>
  );
}

// Export main examples
export default FormBuilderExample;