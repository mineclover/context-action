# Store Only 패턴 예제

순수 상태 관리를 위한 **Store Only 패턴**의 실제 사용 예제입니다. 액션 디스패치 없이 데이터 레이어, 애플리케이션 상태, 반응형 데이터 플로우에 이상적인 패턴입니다.

## 사용 사례

- 애플리케이션 상태 관리
- 폼 상태 및 UI 상태
- 데이터 캐싱 및 지속성
- 파생 상태 및 계산된 값
- 컴포넌트 레벨 상태 관리

## 완전한 예제

### 1. 스토어 설정 정의

```typescript
// stores/UserStoreConfig.ts
export const userStoreConfig = {
  // 직접 값 설정 (타입이 자동으로 추론됨)
  profile: {
    id: '',
    name: '',
    email: '',
    avatar: '',
    bio: '',
    createdAt: null as Date | null,
    lastLogin: null as Date | null
  },
  
  // 검증이 포함된 설정 객체
  preferences: {
    initialValue: {
      theme: 'light' as 'light' | 'dark',
      language: 'ko' as 'ko' | 'en' | 'es' | 'fr' | 'de',
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      privacy: {
        profileVisibility: 'public' as 'public' | 'friends' | 'private',
        showEmail: false,
        showLastLogin: false
      }
    },
    validator: (value) => {
      if (typeof value !== 'object' || value === null) return false;
      if (!['light', 'dark'].includes(value.theme)) return false;
      if (!['ko', 'en', 'es', 'fr', 'de'].includes(value.language)) return false;
      return true;
    }
  },
  
  // 파생 상태 설정
  analytics: {
    initialValue: {
      sessions: [] as Array<{ id: string; startTime: number; endTime?: number }>,
      pageViews: [] as Array<{ page: string; timestamp: number; duration?: number }>,
      events: [] as Array<{ type: string; data: any; timestamp: number }>
    },
    derived: {
      // 자동으로 업데이트되는 계산된 속성
      totalSessions: (analytics) => analytics.sessions.length,
      activeSessions: (analytics) => analytics.sessions.filter(s => !s.endTime).length,
      avgSessionDuration: (analytics) => {
        const completedSessions = analytics.sessions.filter(s => s.endTime);
        if (completedSessions.length === 0) return 0;
        
        const totalDuration = completedSessions.reduce((acc, session) => 
          acc + (session.endTime! - session.startTime), 0
        );
        return totalDuration / completedSessions.length;
      },
      recentEvents: (analytics) => 
        analytics.events.filter(e => Date.now() - e.timestamp < 300000), // 최근 5분
      eventsByType: (analytics) => 
        analytics.events.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    }
  },
  
  // 폼 상태 설정
  forms: {
    initialValue: {
      profileEdit: {
        isEditing: false,
        hasChanges: false,
        errors: {} as Record<string, string>,
        originalValues: null as any
      },
      contactForm: {
        isSubmitting: false,
        submitted: false,
        values: { name: '', email: '', message: '' },
        errors: {} as Record<string, string>
      }
    }
  }
} as const;
```

### 2. 스토어 패턴 생성

```typescript
// stores/UserStores.tsx
import { createDeclarativeStorePattern } from '@context-action/react';
import { userStoreConfig } from './UserStoreConfig';

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', userStoreConfig);

export type UserStores = typeof userStoreConfig;
```

### 3. 프로필 관리 컴포넌트

```typescript
// components/UserProfile.tsx
import React, { useState } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function UserProfile() {
  const profileStore = useUserStore('profile');
  const formsStore = useUserStore('forms');
  const preferencesStore = useUserStore('preferences');
  
  // 반응형 구독
  const profile = useStoreValue(profileStore);
  const forms = useStoreValue(formsStore);
  const preferences = useStoreValue(preferencesStore);
  
  // 폼 입력을 위한 로컬 컴포넌트 상태
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    bio: profile.bio
  });
  
  const startEditing = () => {
    // 취소 기능을 위해 원본 값 저장
    formsStore.update(current => ({
      ...current,
      profileEdit: {
        ...current.profileEdit,
        isEditing: true,
        originalValues: { ...profile }
      }
    }));
    
    // 현재 프로필로 폼 데이터 초기화
    setFormData({
      name: profile.name,
      email: profile.email,
      bio: profile.bio
    });
  };
  
  const cancelEditing = () => {
    // 폼 데이터를 원본 값으로 복원
    const originalValues = forms.profileEdit.originalValues;
    if (originalValues) {
      setFormData({
        name: originalValues.name,
        email: originalValues.email,
        bio: originalValues.bio
      });
    }
    
    // 편집 상태 지우기
    formsStore.update(current => ({
      ...current,
      profileEdit: {
        isEditing: false,
        hasChanges: false,
        errors: {},
        originalValues: null
      }
    }));
  };
  
  const saveChanges = () => {
    // 폼 데이터 검증
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = '이름은 필수입니다';
    }
    
    if (!formData.email.trim()) {
      errors.email = '이메일은 필수입니다';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '올바르지 않은 이메일 형식입니다';
    }
    
    // 폼 에러 업데이트
    formsStore.update(current => ({
      ...current,
      profileEdit: {
        ...current.profileEdit,
        errors
      }
    }));
    
    if (Object.keys(errors).length === 0) {
      // 프로필 스토어에 저장
      profileStore.update(current => ({
        ...current,
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        lastLogin: new Date()
      }));
      
      // 편집 상태 지우기
      formsStore.update(current => ({
        ...current,
        profileEdit: {
          isEditing: false,
          hasChanges: false,
          errors: {},
          originalValues: null
        }
      }));
    }
  };
  
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(current => ({ ...current, [field]: value }));
    
    // 변경사항 있음으로 표시
    formsStore.update(current => ({
      ...current,
      profileEdit: {
        ...current.profileEdit,
        hasChanges: true,
        errors: {
          ...current.profileEdit.errors,
          [field]: '' // 변경 시 필드 에러 지우기
        }
      }
    }));
  };
  
  return (
    <div className={`profile-component theme-${preferences.theme}`}>
      <div className="profile-header">
        <h2>사용자 프로필</h2>
        {!forms.profileEdit.isEditing && (
          <button onClick={startEditing} className="edit-button">
            프로필 편집
          </button>
        )}
      </div>
      
      {forms.profileEdit.isEditing ? (
        // 편집 모드
        <div className="profile-edit-form">
          <div className="form-group">
            <label htmlFor="name">이름:</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={forms.profileEdit.errors.name ? 'error' : ''}
            />
            {forms.profileEdit.errors.name && (
              <span className="error-message">{forms.profileEdit.errors.name}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">이메일:</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={forms.profileEdit.errors.email ? 'error' : ''}
            />
            {forms.profileEdit.errors.email && (
              <span className="error-message">{forms.profileEdit.errors.email}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">소개:</label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="form-actions">
            <button 
              onClick={saveChanges}
              className="save-button"
              disabled={!forms.profileEdit.hasChanges}
            >
              변경사항 저장
            </button>
            <button onClick={cancelEditing} className="cancel-button">
              취소
            </button>
          </div>
        </div>
      ) : (
        // 보기 모드
        <div className="profile-view">
          <div className="profile-info">
            <p><strong>ID:</strong> {profile.id || '설정되지 않음'}</p>
            <p><strong>이름:</strong> {profile.name || '설정되지 않음'}</p>
            <p><strong>이메일:</strong> {profile.email || '설정되지 않음'}</p>
            <p><strong>소개:</strong> {profile.bio || '소개가 없습니다'}</p>
            {profile.lastLogin && (
              <p><strong>마지막 로그인:</strong> {profile.lastLogin.toLocaleString()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. 설정 컴포넌트

```typescript
// components/UserPreferences.tsx
import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function UserPreferences() {
  const preferencesStore = useUserStore('preferences');
  const preferences = useStoreValue(preferencesStore);
  
  const updateTheme = (theme: 'light' | 'dark') => {
    preferencesStore.update(current => ({
      ...current,
      theme
    }));
  };
  
  const updateLanguage = (language: 'ko' | 'en' | 'es' | 'fr' | 'de') => {
    preferencesStore.update(current => ({
      ...current,
      language
    }));
  };
  
  const updateNotificationSettings = (
    type: keyof typeof preferences.notifications,
    enabled: boolean
  ) => {
    preferencesStore.update(current => ({
      ...current,
      notifications: {
        ...current.notifications,
        [type]: enabled
      }
    }));
  };
  
  const updatePrivacySetting = (
    setting: keyof typeof preferences.privacy,
    value: any
  ) => {
    preferencesStore.update(current => ({
      ...current,
      privacy: {
        ...current.privacy,
        [setting]: value
      }
    }));
  };
  
  return (
    <div className={`preferences-component theme-${preferences.theme}`}>
      <h2>사용자 설정</h2>
      
      {/* 테마 선택 */}
      <div className="preference-group">
        <h3>테마</h3>
        <div className="theme-options">
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={preferences.theme === 'light'}
              onChange={() => updateTheme('light')}
            />
            라이트 테마
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={preferences.theme === 'dark'}
              onChange={() => updateTheme('dark')}
            />
            다크 테마
          </label>
        </div>
      </div>
      
      {/* 언어 선택 */}
      <div className="preference-group">
        <h3>언어</h3>
        <select
          value={preferences.language}
          onChange={(e) => updateLanguage(e.target.value as any)}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
      
      {/* 알림 설정 */}
      <div className="preference-group">
        <h3>알림</h3>
        <div className="notification-options">
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.email}
              onChange={(e) => updateNotificationSettings('email', e.target.checked)}
            />
            이메일 알림
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.push}
              onChange={(e) => updateNotificationSettings('push', e.target.checked)}
            />
            푸시 알림
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.sms}
              onChange={(e) => updateNotificationSettings('sms', e.target.checked)}
            />
            SMS 알림
          </label>
        </div>
      </div>
      
      {/* 개인정보 설정 */}
      <div className="preference-group">
        <h3>개인정보</h3>
        <div className="privacy-options">
          <div>
            <label htmlFor="profile-visibility">프로필 공개 범위:</label>
            <select
              id="profile-visibility"
              value={preferences.privacy.profileVisibility}
              onChange={(e) => updatePrivacySetting('profileVisibility', e.target.value)}
            >
              <option value="public">공개</option>
              <option value="friends">친구만</option>
              <option value="private">비공개</option>
            </select>
          </div>
          
          <label>
            <input
              type="checkbox"
              checked={preferences.privacy.showEmail}
              onChange={(e) => updatePrivacySetting('showEmail', e.target.checked)}
            />
            이메일 공개
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={preferences.privacy.showLastLogin}
              onChange={(e) => updatePrivacySetting('showLastLogin', e.target.checked)}
            />
            마지막 로그인 시간 공개
          </label>
        </div>
      </div>
    </div>
  );
}
```

### 5. 애널리틱스 대시보드

```typescript
// components/AnalyticsDashboard.tsx
import React, { useEffect } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function AnalyticsDashboard() {
  const analyticsStore = useUserStore('analytics');
  const analytics = useStoreValue(analyticsStore);
  
  // 애널리틱스 데이터 추가 시뮬레이션
  useEffect(() => {
    const startSession = () => {
      analyticsStore.update(current => ({
        ...current,
        sessions: [
          ...current.sessions,
          {
            id: generateSessionId(),
            startTime: Date.now()
          }
        ]
      }));
    };
    
    const addPageView = () => {
      analyticsStore.update(current => ({
        ...current,
        pageViews: [
          ...current.pageViews,
          {
            page: window.location.pathname,
            timestamp: Date.now()
          }
        ]
      }));
    };
    
    // 마운트 시 세션 시작
    startSession();
    addPageView();
    
    // 데모를 위한 랜덤 이벤트 추가
    const eventInterval = setInterval(() => {
      const eventTypes = ['click', 'scroll', 'hover', 'focus'];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      analyticsStore.update(current => ({
        ...current,
        events: [
          ...current.events,
          {
            type: randomEvent,
            data: { element: `element-${Math.floor(Math.random() * 100)}` },
            timestamp: Date.now()
          }
        ]
      }));
    }, 3000);
    
    return () => {
      clearInterval(eventInterval);
      
      // 언마운트 시 세션 종료
      analyticsStore.update(current => ({
        ...current,
        sessions: current.sessions.map(session => 
          session.endTime ? session : { ...session, endTime: Date.now() }
        )
      }));
    };
  }, [analyticsStore]);
  
  const clearAnalytics = () => {
    analyticsStore.update(current => ({
      ...current,
      sessions: [],
      pageViews: [],
      events: []
    }));
  };
  
  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>애널리틱스 대시보드</h2>
        <button onClick={clearAnalytics} className="clear-button">
          데이터 지우기
        </button>
      </div>
      
      {/* 세션 통계 */}
      <div className="analytics-section">
        <h3>세션</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{analytics.totalSessions}</div>
            <div className="stat-label">총 세션 수</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.activeSessions}</div>
            <div className="stat-label">활성 세션</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {Math.round(analytics.avgSessionDuration / 1000)}초
            </div>
            <div className="stat-label">평균 지속시간</div>
          </div>
        </div>
      </div>
      
      {/* 최근 이벤트 */}
      <div className="analytics-section">
        <h3>최근 이벤트 ({analytics.recentEvents.length})</h3>
        <div className="events-list">
          {analytics.recentEvents.slice(-10).reverse().map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-type">{event.type}</div>
              <div className="event-data">{JSON.stringify(event.data)}</div>
              <div className="event-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 타입별 이벤트 */}
      <div className="analytics-section">
        <h3>타입별 이벤트</h3>
        <div className="event-types">
          {Object.entries(analytics.eventsByType).map(([type, count]) => (
            <div key={type} className="event-type-stat">
              <span className="type-name">{type}</span>
              <span className="type-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### 6. 연락처 폼 컴포넌트

```typescript
// components/ContactForm.tsx
import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function ContactForm() {
  const formsStore = useUserStore('forms');
  const forms = useStoreValue(formsStore);
  
  const contactForm = forms.contactForm;
  
  const updateField = (field: keyof typeof contactForm.values, value: string) => {
    formsStore.update(current => ({
      ...current,
      contactForm: {
        ...current.contactForm,
        values: {
          ...current.contactForm.values,
          [field]: value
        },
        errors: {
          ...current.contactForm.errors,
          [field]: '' // 필드 에러 지우기
        }
      }
    }));
  };
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const { name, email, message } = contactForm.values;
    
    if (!name.trim()) errors.name = '이름은 필수입니다';
    if (!email.trim()) {
      errors.email = '이메일은 필수입니다';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바르지 않은 이메일 형식입니다';
    }
    if (!message.trim()) errors.message = '메시지는 필수입니다';
    if (message.length < 10) errors.message = '메시지는 최소 10자 이상이어야 합니다';
    
    formsStore.update(current => ({
      ...current,
      contactForm: {
        ...current.contactForm,
        errors
      }
    }));
    
    return Object.keys(errors).length === 0;
  };
  
  const submitForm = async () => {
    if (!validateForm()) return;
    
    // 제출 상태 설정
    formsStore.update(current => ({
      ...current,
      contactForm: {
        ...current.contactForm,
        isSubmitting: true
      }
    }));
    
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 성공
      formsStore.update(current => ({
        ...current,
        contactForm: {
          ...current.contactForm,
          isSubmitting: false,
          submitted: true,
          values: { name: '', email: '', message: '' } // 폼 지우기
        }
      }));
      
    } catch (error) {
      // 에러
      formsStore.update(current => ({
        ...current,
        contactForm: {
          ...current.contactForm,
          isSubmitting: false,
          errors: {
            submit: '메시지 전송에 실패했습니다. 다시 시도해주세요.'
          }
        }
      }));
    }
  };
  
  const resetForm = () => {
    formsStore.update(current => ({
      ...current,
      contactForm: {
        isSubmitting: false,
        submitted: false,
        values: { name: '', email: '', message: '' },
        errors: {}
      }
    }));
  };
  
  if (contactForm.submitted) {
    return (
      <div className="contact-form success">
        <h2>메시지가 전송되었습니다!</h2>
        <p>메시지를 보내주셔서 감사합니다. 빠른 시일 내에 연락드리겠습니다.</p>
        <button onClick={resetForm}>다른 메시지 보내기</button>
      </div>
    );
  }
  
  return (
    <div className="contact-form">
      <h2>문의하기</h2>
      
      <div className="form-group">
        <label htmlFor="contact-name">이름:</label>
        <input
          id="contact-name"
          type="text"
          value={contactForm.values.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={contactForm.errors.name ? 'error' : ''}
          disabled={contactForm.isSubmitting}
        />
        {contactForm.errors.name && (
          <span className="error-message">{contactForm.errors.name}</span>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="contact-email">이메일:</label>
        <input
          id="contact-email"
          type="email"
          value={contactForm.values.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={contactForm.errors.email ? 'error' : ''}
          disabled={contactForm.isSubmitting}
        />
        {contactForm.errors.email && (
          <span className="error-message">{contactForm.errors.email}</span>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="contact-message">메시지:</label>
        <textarea
          id="contact-message"
          value={contactForm.values.message}
          onChange={(e) => updateField('message', e.target.value)}
          className={contactForm.errors.message ? 'error' : ''}
          disabled={contactForm.isSubmitting}
          rows={5}
        />
        {contactForm.errors.message && (
          <span className="error-message">{contactForm.errors.message}</span>
        )}
      </div>
      
      {contactForm.errors.submit && (
        <div className="error-message submit-error">
          {contactForm.errors.submit}
        </div>
      )}
      
      <div className="form-actions">
        <button
          onClick={submitForm}
          disabled={contactForm.isSubmitting}
          className="submit-button"
        >
          {contactForm.isSubmitting ? '전송 중...' : '메시지 보내기'}
        </button>
        <button onClick={resetForm} className="reset-button">
          폼 초기화
        </button>
      </div>
    </div>
  );
}
```

### 7. HOC 패턴을 사용한 메인 애플리케이션

```typescript
// App.tsx
import React from 'react';
import { withUserStoreProvider } from './stores/UserStores';
import { UserProfile } from './components/UserProfile';
import { UserPreferences } from './components/UserPreferences';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ContactForm } from './components/ContactForm';
import './App.css';

// HOC 패턴을 사용하여 자동으로 스토어 프로바이더로 감싸기
const App = withUserStoreProvider(() => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Store Only 패턴 데모</h1>
        <p>액션 디스패치 없이 순수 상태 관리를 보여줍니다</p>
      </header>
      
      <main className="app-main">
        <div className="left-column">
          <UserProfile />
          <ContactForm />
        </div>
        
        <div className="right-column">
          <UserPreferences />
          <AnalyticsDashboard />
        </div>
      </main>
    </div>
  );
});

export default App;
```

## 고급 스토어 패턴

### 상태 지속성

```typescript
// hooks/usePersistence.ts
import { useEffect } from 'react';
import { useUserStoreManager } from '../stores/UserStores';

export function usePersistence() {
  const storeManager = useUserStoreManager();
  
  // localStorage에 자동 저장
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const state = storeManager.getAllValues();
      localStorage.setItem('user-app-state', JSON.stringify(state));
    }, 5000); // 5초마다 저장
    
    return () => clearInterval(saveInterval);
  }, [storeManager]);
  
  // 마운트 시 localStorage에서 로드
  useEffect(() => {
    const savedState = localStorage.getItem('user-app-state');
    if (savedState) {
      try {
        const data = JSON.parse(savedState);
        
        // 상태 검증 및 복원
        if (data.profile) {
          storeManager.getStore('profile').setValue({
            ...data.profile,
            lastLogin: data.profile.lastLogin ? new Date(data.profile.lastLogin) : null
          });
        }
        
        if (data.preferences) {
          storeManager.getStore('preferences').setValue(data.preferences);
        }
      } catch (error) {
        console.error('상태 복원 실패:', error);
      }
    }
  }, [storeManager]);
}
```

### 계산된 상태 컴포넌트

```typescript
// components/ComputedState.tsx
import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function ComputedStateDemo() {
  const analyticsStore = useUserStore('analytics');
  const preferencesStore = useUserStore('preferences');
  
  const analytics = useStoreValue(analyticsStore);
  const preferences = useStoreValue(preferencesStore);
  
  // 계산된 값들은 기본 상태가 변경될 때 자동으로 업데이트됨
  return (
    <div className="computed-state">
      <h2>계산된 상태 예제</h2>
      
      <div className="computed-values">
        <div className="computed-item">
          <strong>총 세션 수:</strong> {analytics.totalSessions}
        </div>
        <div className="computed-item">
          <strong>활성 세션:</strong> {analytics.activeSessions}
        </div>
        <div className="computed-item">
          <strong>평균 세션 지속시간:</strong> {Math.round(analytics.avgSessionDuration / 1000)}초
        </div>
        <div className="computed-item">
          <strong>최근 이벤트 수:</strong> {analytics.recentEvents.length}
        </div>
      </div>
      
      <div className="event-types-breakdown">
        <h3>이벤트 타입별 분석</h3>
        {Object.entries(analytics.eventsByType).map(([type, count]) => (
          <div key={type} className="event-type-row">
            <span>{type}:</span>
            <span>{count} 이벤트</span>
            <div 
              className="event-bar" 
              style={{ 
                width: `${(count / Math.max(...Object.values(analytics.eventsByType))) * 100}%` 
              }}
            />
          </div>
        ))}
      </div>
      
      <div className="preferences-summary">
        <h3>사용자 설정 요약</h3>
        <p>테마: {preferences.theme}</p>
        <p>언어: {preferences.language}</p>
        <p>활성화된 알림: {
          Object.values(preferences.notifications).filter(Boolean).length
        } / {Object.keys(preferences.notifications).length}</p>
        <p>개인정보 수준: {preferences.privacy.profileVisibility}</p>
      </div>
    </div>
  );
}
```

## 실제 통합

### 폼 검증 패턴

```typescript
// utils/formValidation.ts
export class FormValidator {
  static validateProfile(values: any) {
    const errors: Record<string, string> = {};
    
    if (!values.name?.trim()) {
      errors.name = '이름은 필수입니다';
    } else if (values.name.length < 2) {
      errors.name = '이름은 최소 2자 이상이어야 합니다';
    }
    
    if (!values.email?.trim()) {
      errors.email = '이메일은 필수입니다';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = '올바르지 않은 이메일 형식입니다';
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
  }
  
  static validateContactForm(values: any) {
    const errors: Record<string, string> = {};
    
    if (!values.name?.trim()) errors.name = '이름은 필수입니다';
    if (!values.email?.trim()) errors.email = '이메일은 필수입니다';
    if (!values.message?.trim()) errors.message = '메시지는 필수입니다';
    if (values.message?.length < 10) errors.message = '메시지가 너무 짧습니다';
    
    return { isValid: Object.keys(errors).length === 0, errors };
  }
}
```

### 서버 동기화

```typescript
// hooks/useServerSync.ts
import { useEffect } from 'react';
import { useUserStoreManager } from '../stores/UserStores';

export function useServerSync() {
  const storeManager = useUserStoreManager();
  
  // 30초마다 서버와 동기화
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const currentState = storeManager.getAllValues();
        
        // 현재 상태를 서버로 전송
        const response = await fetch('/api/sync-user-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentState)
        });
        
        if (response.ok) {
          const serverState = await response.json();
          
          // 서버 상태와 다르면 업데이트
          if (JSON.stringify(currentState) !== JSON.stringify(serverState)) {
            storeManager.setAllValues(serverState);
          }
        }
      } catch (error) {
        console.error('동기화 실패:', error);
      }
    }, 30000);
    
    return () => clearInterval(syncInterval);
  }, [storeManager]);
}
```

## 주요 특징

✅ **타입 안전성**: 수동 타입 주석 없이 자동 타입 추론  
✅ **반응형 업데이트**: 상태 변경 시 컴포넌트 자동 재렌더링  
✅ **파생 상태**: 기본 상태가 변경될 때 계산된 속성 자동 업데이트  
✅ **검증**: 커스텀 검증 함수가 있는 내장 검증 지원  
✅ **HOC 패턴**: `withProvider()`를 사용한 깔끔한 프로바이더 통합  
✅ **스토어 매니저**: 재설정, 내보내기, 벌크 작업을 위한 중앙화된 관리

## 베스트 프랙티스

1. **직접 값**: 단순한 타입에는 직접 값 설정 사용
2. **설정 객체**: 복잡한 검증과 파생 상태에 사용
3. **HOC 패턴**: 자동 프로바이더 감싸기를 위해 `withProvider()` 선호
4. **반응형 구독**: 컴포넌트 업데이트를 위해 항상 `useStoreValue()` 사용
5. **벌크 작업**: 재설정과 벌크 작업에 스토어 매니저 사용
6. **상태 구조**: 관련된 상태를 논리적 그룹으로 함께 유지

## 관련 자료

- **[Action Only 패턴](./action-only.md)** - 순수 액션 디스패치 패턴
- **[패턴 조합](./pattern-composition.md)** - Action 패턴과 결합하기
- **[기본 설정](./basic-setup.md)** - 두 패턴을 모두 사용한 기본 설정