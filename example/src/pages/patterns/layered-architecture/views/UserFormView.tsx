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

// 🎯 Enhanced Fake Data Generator
const FAKE_NAMES = [
  // Tech Legends
  'Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Tim Berners-Lee', 'Linus Torvalds',
  'Margaret Hamilton', 'John von Neumann', 'Katherine Johnson', 'Dennis Ritchie',

  // Modern Tech
  'Satya Nadella', 'Sundar Pichai', 'Jensen Huang', 'Lisa Su', 'Ginni Rometty',
  'Reid Hoffman', 'Brian Chesky', 'Susan Wojcicki', 'Sheryl Sandberg',

  // Pop Culture & Fun
  'Tony Stark', 'Hermione Granger', 'Tyrion Lannister', 'Princess Leia', 'Spock',
  'Wonder Woman', 'Black Widow', 'Captain Marvel', 'Doctor Strange', 'Eleven',

  // International Names
  '김민수', '이영희', '박철수', '최지현', '정수민', '강호동', '유재석', '아이유',
  'Akira Tanaka', 'Yuki Sato', 'Hiroshi Yamamoto', 'Marie Dubois', 'Hans Mueller',
  'Giuseppe Rossi', 'Sofia Andersson', 'Raj Patel', 'Priya Sharma', 'Chen Wei',

  // Classic & Fun
  'Alice Wonderland', 'Bob Builder', 'Charlie Chocolate', 'Diana Adventure',
  'Ethan Mission', 'Fiona Shrek', 'George Curious', 'Luna Moon', 'Neo Matrix'
];

const FAKE_DOMAINS = [
  // Real domains
  'gmail.com', 'naver.com', 'daum.net', 'yahoo.com', 'hotmail.com', 'outlook.com',

  // Tech company domains
  'apple.com', 'google.com', 'microsoft.com', 'amazon.com', 'meta.com',
  'netflix.com', 'spotify.com', 'zoom.us', 'slack.com', 'github.com',

  // Fun fictional domains
  'starkindustries.com', 'wayneenterprises.com', 'umbrella.corp', 'oscorp.com',
  'cyberdyne.tech', 'aperture.science', 'blackmesa.gov', 'vault-tec.com',

  // Modern startup style
  'nextgen.ai', 'quantum.dev', 'blockchain.io', 'startup.vc', 'unicorn.co',
  'innovation.tech', 'future.app', 'digital.space', 'cloud.ninja', 'data.rocks'
];

const FAKE_ROLES: User['role'][] = ['guest', 'user', 'admin'];

// Fun facts for generated users
const FUN_FACTS = [
  'loves coffee and debugging', 'speaks 5 programming languages', 'builds robots in spare time',
  'writes poetry about algorithms', 'collects vintage keyboards', 'dreams in binary',
  'can solve a Rubik\'s cube in 30 seconds', 'has read all of Stack Overflow',
  'once found a bug by staring at code', 'types 120 WPM', 'prefers vim over emacs',
  'thinks semicolons are optional', 'believes in 10x engineers', 'codes while sleeping'
];

function generateFakeUserData(): UserFormData {
  const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)] || 'Unknown User';
  const emailPrefix = name.toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    + Math.floor(Math.random() * 100);
  const domain = FAKE_DOMAINS[Math.floor(Math.random() * FAKE_DOMAINS.length)] || 'example.com';
  const email = `${emailPrefix}@${domain}`;
  const role = FAKE_ROLES[Math.floor(Math.random() * FAKE_ROLES.length)] || 'user';

  return { name, email, role };
}

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

  const [isGenerating, setIsGenerating] = useState(false);

  const handleFillFakeData = async () => {
    setIsGenerating(true);

    // Add a small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    const fakeData = generateFakeUserData();
    setFormData(fakeData);

    // Trigger validation if available
    if (onValidate) {
      onValidate({
        name: fakeData.name,
        email: fakeData.email,
      });
    }

    setIsGenerating(false);

    // Fun console message
    console.log(`🎉 Generated fake user: ${fakeData.name} (${fakeData.email}) - ${fakeData.role}`);
  };

  const canSubmit = formData.name.trim() && formData.email.trim() && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* 🎯 Quick Fill Button for Development */}
      {mode === 'create' && (
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎲</span>
            <div>
              <h3 className="text-sm font-semibold text-purple-800">Quick Development Helper</h3>
              <p className="text-xs text-purple-600">Generate random user data for testing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillFakeData}
            disabled={isSubmitting || isGenerating}
            className="
              flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium
              hover:bg-purple-700 transition-all duration-200 transform hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              shadow-md hover:shadow-lg
            "
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span className="text-base">🎯</span>
                <span>Fill with Fake Data</span>
              </>
            )}
          </button>
        </div>
      )}

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