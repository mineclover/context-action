/**
 * @fileoverview User Profile Demo Page - Individual Demo
 * 폼 처리와 유효성 검사, 실시간 업데이트가 포함된 사용자 프로필 관리
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import { UserProfileDemo } from './store-scenarios/components';
import { StoreScenarios } from './store-scenarios/stores';

export function UserProfilePage() {
  return (
    <PageWithLogMonitor
      pageId="user-profile-demo"
      title="User Profile Demo"
    >
      <StoreScenarios.Provider>
        <div className="max-w-4xl mx-auto p-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-xl mb-8 border border-orange-200">
            <div className="flex items-start gap-6">
              <div className="text-5xl">👤</div>
              <div>
                <h1 className="text-3xl font-bold text-orange-900 mb-4">User Profile Management Demo</h1>
                <p className="text-orange-800 text-lg mb-4">
                  폼 처리와 <strong>유효성 검사</strong>, 실시간 업데이트가 포함된 사용자 프로필 관리 시스템입니다.
                  실제 사용자 설정 페이지에서 사용되는 핵심 패턴들을 구현했습니다.
                </p>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-600">⚙️</span>
                    <span className="font-semibold text-orange-800">
                      핵심 기능: 복잡한 객체 업데이트 + 중첩 속성 관리
                    </span>
                  </div>
                  <p className="text-orange-800 text-sm">
                    프로필 편집, 설정 변경, 테마 전환, 알림 토글, 완성도 계산 기능을 제공합니다.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-3">👤 프로필 기능</h3>
                    <ul className="text-orange-700 space-y-2 text-sm">
                      <li>• <strong>Profile Edit</strong>: 이름, 이메일 수정</li>
                      <li>• <strong>Nested Updates</strong>: 중첩 객체 업데이트</li>
                      <li>• <strong>Preference Management</strong>: 설정 관리</li>
                      <li>• <strong>Theme Toggle</strong>: 라이트/다크 전환</li>
                      <li>• <strong>Notification Control</strong>: 알림 설정</li>
                      <li>• <strong>Progress Tracking</strong>: 완성도 계산</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-3">⚡ 기술 특징</h3>
                    <ul className="text-orange-700 space-y-2 text-sm">
                      <li>• 복잡한 객체 상태 관리</li>
                      <li>• 중첩 속성 안전 업데이트</li>
                      <li>• 실시간 유효성 검사</li>
                      <li>• 편집 모드 상태 관리</li>
                      <li>• 취소 및 복원 기능</li>
                      <li>• 진행률 시각화</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <span className="text-3xl">👤</span>
                      Live Demo
                    </h2>
                    <p className="text-orange-100 text-sm mt-2 leading-relaxed">
                      프로필을 편집하고, 설정을 변경하고, 실시간 업데이트를 확인해보세요
                    </p>
                  </div>
                  <div className="text-right text-orange-100 text-xs">
                    <div>Form Validation</div>
                    <div>Nested Updates</div>
                    <div>Real-time Sync</div>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <UserProfileDemo />
              </div>
            </div>
          </div>

          {/* Technical Implementation */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">🔧 기술적 구현 세부사항</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-orange-600">Store Pattern</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>userStore</strong>: 사용자 정보 중앙 관리</li>
                  <li>• <strong>Nested Object Updates</strong>: 안전한 중첩 업데이트</li>
                  <li>• <strong>Immutable State</strong>: 불변성 보장</li>
                  <li>• <strong>Computed Properties</strong>: 완성도 계산</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-green-600">Form Management</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Edit Mode Toggle</strong>: 편집/보기 모드</li>
                  <li>• <strong>Form Validation</strong>: 실시간 검증</li>
                  <li>• <strong>Cancel/Save</strong>: 취소 및 저장</li>
                  <li>• <strong>Dirty State</strong>: 변경 사항 추적</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Structure */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">📊 데이터 구조</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-blue-600">기본 정보</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>id</strong>: 사용자 고유 ID</li>
                  <li>• <strong>name</strong>: 사용자 이름</li>
                  <li>• <strong>email</strong>: 이메일 주소</li>
                  <li>• <strong>lastLogin</strong>: 마지막 로그인</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-purple-600">사용자 설정</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>theme</strong>: 라이트/다크 테마</li>
                  <li>• <strong>language</strong>: 언어 설정 (ko/en)</li>
                  <li>• <strong>notifications</strong>: 알림 활성화</li>
                  <li>• <strong>timezone</strong>: 시간대 (구현 가능)</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-red-600">계산된 값</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>완성도</strong>: 프로필 완성률 (%)</li>
                  <li>• <strong>편집 상태</strong>: 현재 편집 모드</li>
                  <li>• <strong>변경 사항</strong>: Dirty 필드 추적</li>
                  <li>• <strong>유효성</strong>: 폼 검증 상태</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">💻 핵심 코드 패턴</h2>
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-4">중첩 객체 업데이트 패턴</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`// 1. 중첩 객체 안전 업데이트
const updateUserThemeHandler = useCallback(
  ({ theme }: { theme: User['preferences']['theme'] }) => {
    userStore.update((prev) => ({
      ...prev,
      preferences: { 
        ...prev.preferences, 
        theme 
      },
    }));
  },
  [userStore]
);

// 2. 편집 폼 상태 관리
const [isEditing, setIsEditing] = useState(false);
const [editForm, setEditForm] = useState(user);

const handleSave = useCallback(() => {
  if (editForm) {
    // 변경된 필드 감지
    const changes = Object.keys(editForm).filter(
      (key) => user?.[key as keyof User] !== editForm[key as keyof User]
    );
    
    logger.logAction('updateUser', {
      oldUser: user,
      newUser: editForm,
      changes
    });
    
    storeActionRegister.dispatch('updateUser', { user: editForm });
  }
  setIsEditing(false);
}, [editForm, user, logger]);

// 3. 프로필 완성도 계산
const completeness = useMemo(() => {
  return profileComputations.calculateCompleteness(user);
}, [user]);

const calculateCompleteness = (user: User): number => {
  if (!user) return 0;
  
  const fields = [
    user.name ? 25 : 0,           // 이름
    user.email ? 25 : 0,          // 이메일
    user.preferences ? 25 : 0,    // 설정
    user.lastLogin ? 25 : 0       // 마지막 로그인
  ];
  
  return Math.min(100, fields.reduce((sum, value) => sum + value, 0));
};`}
              </pre>
            </div>
          </div>

          {/* Related Links */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">🔗 관련 리소스</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a 
                href="/demos/store-scenarios"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                🏪 전체 Store 데모 컬렉션
              </a>
              <a 
                href="/refs/form-builder"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                📝 Form Builder Ref Demo
              </a>
              <a 
                href="/store/basics"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                🏪 Store Basics Guide
              </a>
            </div>
          </div>
        </div>
      </StoreScenarios.Provider>
    </PageWithLogMonitor>
  );
}