/**
 * @fileoverview 사용자 관리 예제
 * 범용 객체 컨텍스트 관리 패턴 적용 사례
 */

import React, { useState, useEffect } from 'react';
import { ManagedObject, ObjectLifecycleState } from '../types';
import { createObjectContextHooks } from '../createObjectContextHooks';

// 사용자 객체 정의
interface User extends ManagedObject {
  id: string;
  type: 'user';
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
  lastAccessed?: Date;
  metadata?: {
    department?: string;
    location?: string;
    preferences?: Record<string, unknown>;
  };
}

// 사용자 관리 컨텍스트 생성
const {
  ObjectContextProvider: UserContextProvider,
  useObjectManager: useUserManager,
  useObjectContextStore: useUserStore,
  useObjectContextActions: useUserActions,
  useObjectContextEvents: useUserEvents
} = createObjectContextHooks<User>({
  contextName: 'UserManagement',
  autoCleanup: {
    enabled: true,
    intervalMs: 300000, // 5분마다
    olderThanMs: 1800000, // 30분 이상
    lifecycleStates: ['inactive', 'archived']
  },
  maxObjects: 1000,
  enableSelection: true,
  enableFocus: true
});

// 사용자 생성 헬퍼
const createUser = (
  id: string, 
  name: string, 
  email: string, 
  role: User['role'] = 'user',
  department?: string
): User => ({
  id,
  type: 'user' as const,
  name,
  email,
  role,
  createdAt: new Date(),
  metadata: {
    department,
    preferences: {}
  }
});

/**
 * 사용자 목록 컴포넌트
 */
const UserList: React.FC = () => {
  const { queryObjects, selectedObjects, select } = useUserManager();
  const [filterRole, setFilterRole] = useState<User['role'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'email'>('name');

  const users = queryObjects({
    ...(filterRole !== 'all' && { 
      metadata: { role: filterRole } 
    }),
    sortBy: sortBy === 'name' ? 'id' : sortBy, // name으로 정렬은 id로 대체 (예제용)
    sortOrder: 'asc'
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">사용자 목록 ({users.length})</h3>
        
        <div className="flex gap-2">
          {/* 역할 필터 */}
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="all">전체 역할</option>
            <option value="admin">관리자</option>
            <option value="user">일반 사용자</option>
            <option value="guest">게스트</option>
          </select>

          {/* 정렬 */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="name">이름순</option>
            <option value="createdAt">생성일순</option>
            <option value="email">이메일순</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {users.map((userMetadata) => {
          const isSelected = selectedObjects.includes(userMetadata.id);
          
          return (
            <div
              key={userMetadata.id}
              onClick={() => select([userMetadata.id], 'toggle')}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{userMetadata.metadata?.name || userMetadata.id}</div>
                  <div className="text-sm text-gray-600">{userMetadata.metadata?.email}</div>
                  <div className="text-xs text-gray-500">
                    {userMetadata.metadata?.department} • {userMetadata.lifecycleState}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(userMetadata.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {filterRole === 'all' ? '사용자가 없습니다' : `${filterRole} 역할의 사용자가 없습니다`}
        </div>
      )}
    </div>
  );
};

/**
 * 사용자 등록 폼 컴포넌트
 */
const UserRegistrationForm: React.FC = () => {
  const { register, getStats } = useUserManager();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as User['role'],
    department: ''
  });

  const stats = getStats();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('이름과 이메일은 필수입니다');
      return;
    }

    const user = createUser(
      `user_${Date.now()}`,
      formData.name,
      formData.email,
      formData.role,
      formData.department || undefined
    );

    register(user.id, user, {
      name: user.name,
      email: user.email,
      role: user.role
    }, {
      source: 'registration_form',
      timestamp: new Date().toISOString()
    });

    // 폼 초기화
    setFormData({
      name: '',
      email: '',
      role: 'user',
      department: ''
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">새 사용자 등록</h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="사용자 이름"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">역할</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="guest">게스트</option>
            <option value="user">일반 사용자</option>
            <option value="admin">관리자</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">부서 (선택)</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="개발팀, 마케팅팀 등"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
        >
          사용자 등록
        </button>
      </form>

      {/* 통계 정보 */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
        <div className="font-medium mb-2">통계</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>총 사용자: {stats.objectCount}</div>
          <div>선택된 사용자: {stats.selectedCount}</div>
          <div>활성: {stats.lifecycleStats.active}</div>
          <div>비활성: {stats.lifecycleStats.inactive}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * 선택된 사용자 액션 패널
 */
const SelectedUserActions: React.FC = () => {
  const { 
    selectedObjects, 
    selectedObjectsInfo, 
    clearSelection,
    activate,
    deactivate,
    archive,
    unregister
  } = useUserManager();

  if (selectedObjects.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-center text-gray-500">
          사용자를 선택하여 액션을 수행하세요
        </div>
      </div>
    );
  }

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'archive' | 'delete') => {
    if (!confirm(`선택된 ${selectedObjects.length}명의 사용자에 대해 ${action} 작업을 수행하시겠습니까?`)) {
      return;
    }

    selectedObjects.forEach(id => {
      switch (action) {
        case 'activate':
          activate(id);
          break;
        case 'deactivate':
          deactivate(id);
          break;
        case 'archive':
          archive(id);
          break;
        case 'delete':
          unregister(id, true);
          break;
      }
    });

    clearSelection();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">선택된 사용자 ({selectedObjects.length})</h3>
        <button
          onClick={clearSelection}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          선택 해제
        </button>
      </div>

      {/* 선택된 사용자 목록 */}
      <div className="mb-4 max-h-32 overflow-y-auto">
        <div className="space-y-1">
          {selectedObjectsInfo.map((userMetadata) => (
            <div key={userMetadata.id} className="text-sm bg-blue-50 p-2 rounded">
              {userMetadata.metadata?.name || userMetadata.id} ({userMetadata.lifecycleState})
            </div>
          ))}
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleBulkAction('activate')}
          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          활성화
        </button>
        <button
          onClick={() => handleBulkAction('deactivate')}
          className="px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
        >
          비활성화
        </button>
        <button
          onClick={() => handleBulkAction('archive')}
          className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
        >
          보관
        </button>
        <button
          onClick={() => handleBulkAction('delete')}
          className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          삭제
        </button>
      </div>
    </div>
  );
};

/**
 * 이벤트 로그 컴포넌트
 */
const UserEventLog: React.FC = () => {
  const [events, setEvents] = useState<Array<{
    id: string;
    type: string;
    objectId: string;
    timestamp: string;
    details: string;
  }>>([]);

  // 이벤트 리스너 등록
  useUserEvents('registered', (event) => {
    setEvents(prev => [{
      id: `${Date.now()}_${Math.random()}`,
      type: 'registered',
      objectId: event.objectId,
      timestamp: event.timestamp.toLocaleTimeString(),
      details: `사용자 등록: ${event.metadata?.metadata?.name || event.objectId}`
    }, ...prev.slice(0, 49)]); // 최대 50개 유지
  });

  useUserEvents('unregistered', (event) => {
    setEvents(prev => [{
      id: `${Date.now()}_${Math.random()}`,
      type: 'unregistered',
      objectId: event.objectId,
      timestamp: event.timestamp.toLocaleTimeString(),
      details: `사용자 해제: ${event.objectId}`
    }, ...prev.slice(0, 49)]);
  });

  useUserEvents('lifecycle_changed', (event) => {
    setEvents(prev => [{
      id: `${Date.now()}_${Math.random()}`,
      type: 'lifecycle_changed',
      objectId: event.objectId,
      timestamp: event.timestamp.toLocaleTimeString(),
      details: `상태 변경: ${event.objectId} -> ${event.metadata?.lifecycleState}`
    }, ...prev.slice(0, 49)]);
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">이벤트 로그</h3>
        <button
          onClick={() => setEvents([])}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          지우기
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1">
        {events.map((event) => (
          <div key={event.id} className="text-xs p-2 bg-gray-50 rounded">
            <span className="text-gray-400">{event.timestamp}</span>
            <span className={`ml-2 px-2 py-1 rounded text-white text-xs ${
              event.type === 'registered' ? 'bg-green-500' :
              event.type === 'unregistered' ? 'bg-red-500' :
              'bg-blue-500'
            }`}>
              {event.type}
            </span>
            <span className="ml-2">{event.details}</span>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center text-gray-500 py-8 text-sm">
          아직 이벤트가 없습니다
        </div>
      )}
    </div>
  );
};

/**
 * 메인 사용자 관리 예제 컴포넌트
 */
const UserManagementExample: React.FC = () => {
  const { cleanup } = useUserManager();

  // 샘플 데이터 추가
  useEffect(() => {
    const { register } = useUserManager();
    
    // 샘플 사용자들 등록
    const sampleUsers = [
      createUser('user_1', 'John Doe', 'john@example.com', 'admin', '개발팀'),
      createUser('user_2', 'Jane Smith', 'jane@example.com', 'user', '마케팅팀'),
      createUser('user_3', 'Bob Johnson', 'bob@example.com', 'user', '개발팀'),
    ];

    sampleUsers.forEach(user => {
      register(user.id, user, {
        name: user.name,
        email: user.email,
        role: user.role
      }, {
        source: 'sample_data',
        timestamp: new Date().toISOString()
      });
    });
  }, []);

  return (
    <UserContextProvider>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">사용자 관리 시스템</h1>
            <p className="text-gray-600">범용 객체 컨텍스트 관리 패턴 예제</p>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => cleanup(600000, ['inactive', 'archived'])} // 10분 이상된 비활성/보관 객체 정리
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
              >
                정리 실행
              </button>
              <button
                onClick={() => cleanup(0, ['created', 'active', 'inactive', 'archived'], true)} // 강제 전체 정리
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                전체 정리 (강제)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* 사용자 등록 폼 */}
            <div className="lg:col-span-1">
              <UserRegistrationForm />
            </div>

            {/* 사용자 목록 */}
            <div className="lg:col-span-1">
              <UserList />
            </div>

            {/* 선택된 사용자 액션 */}
            <div className="lg:col-span-2 xl:col-span-1">
              <SelectedUserActions />
            </div>

            {/* 이벤트 로그 */}
            <div className="lg:col-span-2 xl:col-span-3">
              <UserEventLog />
            </div>
          </div>
        </div>
      </div>
    </UserContextProvider>
  );
};

export default UserManagementExample;