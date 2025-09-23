/**
 * Pure UI Components Layer - User Form View
 *
 * This layer:
 * - Renders form UI with validation display
 * - Handles form interactions and state
 * - Uses validation data from hooks
 * - Triggers actions on form submission
 */

import React, { memo, useState, useEffect } from 'react';
import type { User, UserValidationResult } from '../contexts/UserManagementContexts';

interface UserFormViewProps {
  mode: 'create' | 'edit';
  initialData?: Partial<User>;
  validationResult?: UserValidationResult | null;
  isSubmitting: boolean;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  onValidate?: (data: Pick<UserFormData, 'name' | 'email'>) => void;
}

export interface UserFormData {
  name: string;
  email: string;
  role: User['role'];
}

export const UserFormView = memo<UserFormViewProps>(({
  mode,
  initialData,
  validationResult,
  isSubmitting,
  onSubmit,
  onCancel,
  onValidate,
}) => {
  // 🎯 Form State
  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || 'user',
  });

  // 🎯 Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        role: initialData.role || 'user',
      });
    }
  }, [initialData]);

  // 🎯 Field validation helpers
  const getFieldError = (fieldName: keyof Pick<UserFormData, 'name' | 'email'>) => {
    if (!validationResult || validationResult.isValid) return null;

    const fieldErrors = validationResult.errors.filter(error =>
      error.toLowerCase().includes(fieldName.toLowerCase())
    );

    return fieldErrors.length > 0 ? fieldErrors[0] : null;
  };

  const hasError = (fieldName: keyof Pick<UserFormData, 'name' | 'email'>) => {
    return getFieldError(fieldName) !== null;
  };

  // 🎯 Event Handlers
  const handleInputChange = (field: keyof UserFormData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Trigger real-time validation for name and email
    if ((field === 'name' || field === 'email') && onValidate) {
      onValidate({
        name: newData.name,
        email: newData.email,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const canSubmit = formData.name.trim() && formData.email.trim() && !isSubmitting;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enhanced Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className="text-base">👤</span>
            Full Name *
          </label>
          <div className="relative">
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                ${hasError('name')
                  ? 'border-red-500 bg-red-50 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 hover:border-gray-400'
                }
                ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              `}
              placeholder="Enter full name"
              disabled={isSubmitting}
            />
            {formData.name && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-green-500">✓</span>
              </div>
            )}
          </div>
          {hasError('name') && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded-lg">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-red-600">{getFieldError('name')}</p>
            </div>
          )}
        </div>

        {/* Enhanced Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className="text-base">📧</span>
            Email Address *
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                ${hasError('email')
                  ? 'border-red-500 bg-red-50 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 hover:border-gray-400'
                }
                ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              `}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
            {formData.email?.includes('@') && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-green-500">✓</span>
              </div>
            )}
          </div>
          {hasError('email') && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded-lg">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-red-600">{getFieldError('email')}</p>
            </div>
          )}
        </div>

        {/* Enhanced Role Field */}
        <div className="space-y-2">
          <label htmlFor="role" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className="text-base">🏷️</span>
            User Role *
          </label>
          <div className="relative">
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as User['role'])}
              className={`
                w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none cursor-pointer
                ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
                border-gray-300 focus:border-blue-500
              `}
              disabled={isSubmitting}
            >
              <option value="guest">👋 Guest - Limited access</option>
              <option value="user">👤 User - Standard access</option>
              <option value="admin">🛡️ Admin - Full access</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <span className="text-gray-400">▼</span>
            </div>
          </div>
        </div>

        {/* Enhanced Validation Summary */}
        {validationResult && !validationResult.isValid && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="text-xl">❌</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Validation Issues Found:</h4>
                <ul className="space-y-2">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform
              ${canSubmit
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{mode === 'create' ? 'Creating User...' : 'Updating User...'}</span>
              </>
            ) : (
              <>
                <span className="text-lg">
                  {mode === 'create' ? '➕' : '✏️'}
                </span>
                <span>{mode === 'create' ? 'Create User' : 'Update User'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="
              flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold
              hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            "
          >
            <span className="text-lg">❌</span>
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </div>
  );
});

UserFormView.displayName = 'UserFormView';