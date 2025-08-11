# React 통합

Context-Action 프레임워크는 React의 Context API와 훅 시스템을 완전히 활용하여 자연스러운 React 개발 경험을 제공합니다. 이 가이드는 효과적인 React 통합 패턴을 다룹니다.

## 기본 통합 패턴

### 컴포넌트에서의 상태 구독

```typescript
// 반응형 상태 구독
function UserProfile() {
  // 도메인별 스토어 접근
  const profileStore = useUserStore('profile');
  const settingsStore = useUserStore('settings');
  
  // 자동 구독과 리렌더링
  const profile = useStoreValue(profileStore);
  const settings = useStoreValue(settingsStore);
  
  return (
    <div className={`profile theme-${settings.theme}`}>
      <img src={profile.avatar} alt={`${profile.name}의 아바타`} />
      <h1>{profile.name}</h1>
      <p>{profile.email}</p>
    </div>
  );
}
```

### 액션 디스패치

```typescript
function UserEditor() {
  const dispatch = useUserAction();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 타입 안전한 액션 디스패치
    await dispatch('updateProfile', {
      data: formData
    });
    
    // 폼 초기화
    setFormData({ name: '', email: '' });
  }, [dispatch, formData]);
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="이름"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="이메일"
      />
      <button type="submit">저장</button>
    </form>
  );
}
```

## 고급 통합 패턴

### 1. 선택적 구독

```typescript
function OptimizedUserDisplay() {
  const profileStore = useUserStore('profile');
  
  // 특정 필드만 구독하여 불필요한 리렌더링 방지
  const userName = useStoreValue(profileStore, profile => profile.name);
  const userEmail = useStoreValue(profileStore, profile => profile.email);
  
  // status 변경 시에는 리렌더링되지 않음
  return (
    <div>
      <h2>{userName}</h2>
      <p>{userEmail}</p>
    </div>
  );
}
```

### 2. 조건부 구독

```typescript
function ConditionalUserData({ showDetails }: { showDetails: boolean }) {
  const profileStore = useUserStore('profile');
  
  // showDetails가 true일 때만 프로필 데이터 구독
  const profile = useStoreValue(profileStore, 
    showDetails 
      ? (profile) => profile  // 전체 프로필 구독
      : () => null           // 구독 안함
  );
  
  if (!showDetails) {
    return <div>기본 정보만 표시</div>;
  }
  
  return (
    <div>
      <h2>{profile?.name}</h2>
      <p>이메일: {profile?.email}</p>
      <p>가입일: {profile?.joinDate}</p>
    </div>
  );
}
```

### 3. 파생 상태 패턴

```typescript
function UserStatsDisplay() {
  const profileStore = useUserStore('profile');
  const activityStore = useUserStore('activity');
  
  const profile = useStoreValue(profileStore);
  const activity = useStoreValue(activityStore);
  
  // 파생 상태 계산
  const stats = useMemo(() => {
    const accountAge = Date.now() - new Date(profile.joinDate).getTime();
    const avgDailyActivity = activity.totalActions / (accountAge / (24 * 60 * 60 * 1000));
    
    return {
      accountAgeDays: Math.floor(accountAge / (24 * 60 * 60 * 1000)),
      averageDailyActivity: Math.round(avgDailyActivity * 100) / 100,
      activityLevel: avgDailyActivity > 10 ? 'high' : avgDailyActivity > 5 ? 'medium' : 'low'
    };
  }, [profile.joinDate, activity.totalActions]);
  
  return (
    <div>
      <h3>사용자 통계</h3>
      <p>계정 사용 일수: {stats.accountAgeDays}일</p>
      <p>일평균 활동: {stats.averageDailyActivity}</p>
      <p>활동 수준: {stats.activityLevel}</p>
    </div>
  );
}
```

### 4. 사용자 정의 훅 조합

```typescript
// 복합 비즈니스 로직 훅
function useUserProfile() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const dispatch = useUserAction();
  
  const profile = useStoreValue(profileStore);
  const session = useStoreValue(sessionStore);
  
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 프로필 업데이트 로직
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    setIsUpdating(true);
    try {
      await dispatch('updateProfile', { data });
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch]);
  
  // 인증 상태 확인
  const isAuthenticated = useMemo(() => {
    return session.isLoggedIn && 
           session.token && 
           (!session.expiresAt || session.expiresAt > Date.now());
  }, [session]);
  
  // 프로필 완성도
  const completionRate = useMemo(() => {
    const fields = ['name', 'email', 'avatar', 'bio', 'location'];
    const completed = fields.filter(field => profile[field]).length;
    return Math.round((completed / fields.length) * 100);
  }, [profile]);
  
  return {
    profile,
    session,
    isUpdating,
    isAuthenticated,
    completionRate,
    updateProfile
  };
}

// 사용법
function UserProfileCard() {
  const { 
    profile, 
    isUpdating, 
    isAuthenticated, 
    completionRate, 
    updateProfile 
  } = useUserProfile();
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return (
    <div className="profile-card">
      <div className="profile-header">
        <img src={profile.avatar} alt="프로필 사진" />
        <h2>{profile.name}</h2>
        <div className="completion-badge">
          프로필 완성도: {completionRate}%
        </div>
      </div>
      
      <ProfileEditForm 
        profile={profile}
        onUpdate={updateProfile}
        isLoading={isUpdating}
      />
    </div>
  );
}
```

### 5. 폼 상태 통합

```typescript
// 폼과 글로벌 상태의 통합
function UserSettingsForm() {
  const settingsStore = useUserStore('settings');
  const settings = useStoreValue(settingsStore);
  const dispatch = useUserAction();
  
  // 로컬 폼 상태 (임시 편집 상태)
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  
  // 글로벌 상태 변경 시 로컬 상태 동기화
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);
  
  // 폼 변경 감지
  const handleFieldChange = useCallback((field: string, value: any) => {
    setLocalSettings(prev => {
      const updated = { ...prev, [field]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(settings));
      return updated;
    });
  }, [settings]);
  
  // 저장
  const handleSave = useCallback(async () => {
    if (hasChanges) {
      await dispatch('updateSettings', { settings: localSettings });
    }
  }, [dispatch, localSettings, hasChanges]);
  
  // 취소
  const handleCancel = useCallback(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);
  
  return (
    <form>
      <div>
        <label>테마</label>
        <select
          value={localSettings.theme}
          onChange={(e) => handleFieldChange('theme', e.target.value)}
        >
          <option value="light">라이트</option>
          <option value="dark">다크</option>
        </select>
      </div>
      
      <div>
        <label>언어</label>
        <select
          value={localSettings.language}
          onChange={(e) => handleFieldChange('language', e.target.value)}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>
      
      <div>
        <label>
          <input
            type="checkbox"
            checked={localSettings.notifications}
            onChange={(e) => handleFieldChange('notifications', e.target.checked)}
          />
          알림 받기
        </label>
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          onClick={handleSave}
          disabled={!hasChanges}
        >
          저장
        </button>
        <button 
          type="button" 
          onClick={handleCancel}
          disabled={!hasChanges}
        >
          취소
        </button>
      </div>
    </form>
  );
}
```

## 성능 최적화 패턴

### 1. 컴포넌트 분할

```typescript
// ❌ 비효율적: 하나의 컴포넌트에서 모든 상태 구독
function LargeUserComponent() {
  const profile = useStoreValue(useUserStore('profile'));
  const settings = useStoreValue(useUserStore('settings'));
  const activity = useStoreValue(useUserStore('activity'));
  const notifications = useStoreValue(useUserStore('notifications'));
  
  // 모든 상태 변경 시 전체 컴포넌트 리렌더링
  return (
    <div>
      <UserHeader profile={profile} />
      <UserSettings settings={settings} />
      <UserActivity activity={activity} />
      <UserNotifications notifications={notifications} />
    </div>
  );
}

// ✅ 효율적: 책임별로 컴포넌트 분할
function OptimizedUserDashboard() {
  return (
    <div>
      <UserHeader />      {/* profile 변경 시만 리렌더링 */}
      <UserSettings />    {/* settings 변경 시만 리렌더링 */}
      <UserActivity />    {/* activity 변경 시만 리렌더링 */}
      <UserNotifications /> {/* notifications 변경 시만 리렌더링 */}
    </div>
  );
}

function UserHeader() {
  const profile = useStoreValue(useUserStore('profile'));
  return (
    <header>
      <h1>{profile.name}</h1>
      <img src={profile.avatar} alt="프로필" />
    </header>
  );
}

function UserSettings() {
  const settings = useStoreValue(useUserStore('settings'));
  return (
    <div className={`settings theme-${settings.theme}`}>
      <h2>설정</h2>
      {/* 설정 UI */}
    </div>
  );
}
```

### 2. React.memo 활용

```typescript
// 메모화된 컴포넌트
const UserCard = React.memo<{
  user: UserProfile;
  onEdit: (id: string) => void;
}>(({ user, onEdit }) => {
  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={() => onEdit(user.id)}>편집</button>
    </div>
  );
});

// 메모화된 액션 핸들러
function UserList() {
  const usersStore = useUserStore('userList');
  const users = useStoreValue(usersStore);
  const dispatch = useUserAction();
  
  // 메모화된 콜백
  const handleEdit = useCallback((userId: string) => {
    dispatch('openUserEditor', { userId });
  }, [dispatch]);
  
  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard 
          key={user.id}
          user={user}
          onEdit={handleEdit} // 메모화되어 불필요한 리렌더링 방지
        />
      ))}
    </div>
  );
}
```

### 3. 지연 로딩

```typescript
// 조건부 컴포넌트 로딩
function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'activity'>('profile');
  
  return (
    <div>
      <nav>
        <button 
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'active' : ''}
        >
          프로필
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'active' : ''}
        >
          설정
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          className={activeTab === 'activity' ? 'active' : ''}
        >
          활동
        </button>
      </nav>
      
      <div className="tab-content">
        {activeTab === 'profile' && <UserProfile />}
        {activeTab === 'settings' && <UserSettings />}
        {activeTab === 'activity' && <UserActivity />}
      </div>
    </div>
  );
}

// React.lazy로 코드 분할
const UserActivity = React.lazy(() => import('./UserActivity'));
const UserSettings = React.lazy(() => import('./UserSettings'));

function LazyUserDashboard() {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'activity'>('profile');
  
  return (
    <div>
      <nav>{/* 탭 네비게이션 */}</nav>
      
      <Suspense fallback={<div>로딩 중...</div>}>
        <div className="tab-content">
          {activeTab === 'profile' && <UserProfile />}
          {activeTab === 'settings' && <UserSettings />}
          {activeTab === 'activity' && <UserActivity />}
        </div>
      </Suspense>
    </div>
  );
}
```

## 에러 경계 통합

### 1. 도메인별 에러 경계

```typescript
// 사용자 도메인 에러 경계
class UserErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 사용자 도메인 오류 로깅
    console.error('User domain error:', error, errorInfo);
    
    // 오류 리포팅 서비스에 전송
    reportError('user-domain', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>사용자 정보를 불러오는 중 오류가 발생했습니다</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            다시 시도
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// 사용법
function App() {
  return (
    <UserProvider>
      <UserErrorBoundary>
        <UserDashboard />
      </UserErrorBoundary>
    </UserProvider>
  );
}
```

### 2. 액션 에러 처리

```typescript
function UserActionComponent() {
  const dispatch = useUserAction();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRiskyAction = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await dispatch('riskyUserAction', { /* payload */ });
      
      if (!result.success) {
        setError(result.error || '알 수 없는 오류가 발생했습니다');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);
  
  return (
    <div>
      {error && (
        <div className="error-message">
          오류: {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <button 
        onClick={handleRiskyAction}
        disabled={isLoading}
      >
        {isLoading ? '처리 중...' : '위험한 액션 실행'}
      </button>
    </div>
  );
}
```

## 테스팅 통합

### 1. 컴포넌트 테스트

```typescript
// __tests__/components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProvider } from '@/providers/UserProvider';
import { UserProfile } from '@/components/UserProfile';

// 테스트 유틸리티
const renderWithUserProvider = (ui: React.ReactElement) => {
  return render(
    <UserProvider>
      {ui}
    </UserProvider>
  );
};

describe('UserProfile', () => {
  it('사용자 정보를 올바르게 표시', async () => {
    renderWithUserProvider(<UserProfile />);
    
    // 기본 프로필 정보 확인
    expect(screen.getByText('Guest User')).toBeInTheDocument();
    expect(screen.getByText('guest@example.com')).toBeInTheDocument();
  });
  
  it('프로필 업데이트 후 변경된 정보 표시', async () => {
    const { container } = renderWithUserProvider(
      <div>
        <UserProfile />
        <UserEditor />
      </div>
    );
    
    // 프로필 편집
    const nameInput = screen.getByPlaceholderText('이름');
    const saveButton = screen.getByText('저장');
    
    fireEvent.change(nameInput, { target: { value: '새 이름' } });
    fireEvent.click(saveButton);
    
    // 업데이트된 정보 확인
    await waitFor(() => {
      expect(screen.getByText('새 이름')).toBeInTheDocument();
    });
  });
});
```

### 2. 훅 테스트

```typescript
// __tests__/hooks/useUserProfile.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { UserProvider } from '@/providers/UserProvider';
import { useUserProfile } from '@/hooks/useUserProfile';

const wrapper = ({ children }) => (
  <UserProvider>{children}</UserProvider>
);

describe('useUserProfile', () => {
  it('초기 프로필 데이터 반환', () => {
    const { result } = renderHook(() => useUserProfile(), { wrapper });
    
    expect(result.current.profile).toEqual({
      id: '',
      name: '',
      email: '',
      avatar: null
    });
    expect(result.current.isAuthenticated).toBe(false);
  });
  
  it('프로필 업데이트 동작', async () => {
    const { result } = renderHook(() => useUserProfile(), { wrapper });
    
    await act(async () => {
      await result.current.updateProfile({ name: '테스트 사용자' });
    });
    
    expect(result.current.profile.name).toBe('테스트 사용자');
  });
});
```

## 모범 사례

### 1. 컴포넌트 설계 원칙

```typescript
// ✅ 좋음: 단일 책임 컴포넌트
function UserAvatar({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const profile = useStoreValue(useUserStore('profile'));
  
  return (
    <img 
      className={`avatar avatar-${size}`}
      src={profile.avatar || '/default-avatar.png'}
      alt={`${profile.name}의 아바타`}
    />
  );
}

function UserName({ showEmail = false }: { showEmail?: boolean }) {
  const profile = useStoreValue(useUserStore('profile'));
  
  return (
    <div>
      <h2>{profile.name || '이름 없음'}</h2>
      {showEmail && <p>{profile.email}</p>}
    </div>
  );
}

// 조합을 통한 복합 컴포넌트
function UserCard() {
  return (
    <div className="user-card">
      <UserAvatar size="large" />
      <UserName showEmail={true} />
    </div>
  );
}
```

### 2. 상태와 UI의 분리

```typescript
// ✅ 좋음: 프레젠테이션 컴포넌트 분리
interface UserProfileViewProps {
  profile: UserProfile;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<UserProfile>) => void;
  onCancel: () => void;
}

function UserProfileView({ 
  profile, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel 
}: UserProfileViewProps) {
  // 순수한 UI 렌더링만 담당
  if (isEditing) {
    return <UserEditForm profile={profile} onSave={onSave} onCancel={onCancel} />;
  }
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.email}</p>
      <button onClick={onEdit}>편집</button>
    </div>
  );
}

// 컨테이너 컴포넌트에서 상태 관리
function UserProfileContainer() {
  const profile = useStoreValue(useUserStore('profile'));
  const dispatch = useUserAction();
  const [isEditing, setIsEditing] = useState(false);
  
  const handleEdit = useCallback(() => setIsEditing(true), []);
  const handleSave = useCallback(async (data: Partial<UserProfile>) => {
    await dispatch('updateProfile', { data });
    setIsEditing(false);
  }, [dispatch]);
  const handleCancel = useCallback(() => setIsEditing(false), []);
  
  return (
    <UserProfileView
      profile={profile}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
```

### 3. 일관된 네이밍

```typescript
// 일관된 명명 규칙
export const useUserProfile = () => { /* 사용자 프로필 로직 */ };
export const useUserSettings = () => { /* 사용자 설정 로직 */ };
export const useUserActivity = () => { /* 사용자 활동 로직 */ };

// 컴포넌트
export const UserProfile = () => { /* 프로필 컴포넌트 */ };
export const UserSettings = () => { /* 설정 컴포넌트 */ };
export const UserActivity = () => { /* 활동 컴포넌트 */ };

// 프로바이더
export const UserProvider = ({ children }) => { /* 사용자 프로바이더 */ };
```

---

## 요약

Context-Action과 React의 통합은 다음 이점을 제공합니다:

- **자연스러운 React 패턴** - 훅과 컨텍스트 API 활용
- **타입 안전한 상태 관리** - 완전한 TypeScript 지원
- **최적화된 리렌더링** - 선택적 구독과 메모화
- **테스트 가능한 구조** - 분리된 로직과 UI
- **확장 가능한 아키텍처** - 컴포넌트 조합과 코드 분할

이러한 패턴을 따르면 성능이 뛰어나고 유지보수 가능한 React 애플리케이션을 구축할 수 있습니다.

---

::: tip 다음 단계
- [프로바이더 구성](./provider-composition) - 도메인 경계와 프로바이더 패턴
- [성능 최적화](./performance) - React 성능 최적화 고급 기법
- [모범 사례](./best-practices) - 프로덕션 환경 권장사항
:::