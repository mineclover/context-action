// 모든 데모 컴포넌트 내보내기
export { UserProfileDemo } from './UserProfileDemo';
export { ShoppingCartDemo } from './ShoppingCartDemo';

// 추후 추가될 컴포넌트들을 위한 placeholder
// export { TodoListDemo } from './TodoListDemo';
// export { ChatDemo } from './ChatDemo';
// export { FormWizardDemo } from './FormWizardDemo';
// export { SettingsDemo } from './SettingsDemo';
// export { NotificationDemo } from './NotificationDemo';

// 임시로 간단한 플레이스홀더 컴포넌트들 생성
import React from 'react';

export const TodoListDemo = () => (
  <div className="demo-card">
    <h3>✅ Todo List Demo</h3>
    <p className="demo-description">CRUD 작업과 필터링, 정렬 기능을 보여주는 할일 목록 데모</p>
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <div>구현 예정 - 모듈화된 컴포넌트</div>
    </div>
  </div>
);

export const ChatDemo = () => (
  <div className="demo-card">
    <h3>💬 Real-time Chat Demo</h3>
    <p className="demo-description">메시지 스트리밍과 자동 스크롤 기능을 보여주는 실시간 채팅 데모</p>
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <div>구현 예정 - 모듈화된 컴포넌트</div>
    </div>
  </div>
);

export const FormWizardDemo = () => (
  <div className="demo-card">
    <h3>📋 Form Wizard Demo</h3>
    <p className="demo-description">다단계 폼 데이터 검증과 진행 추적을 보여주는 폼 위저드 데모</p>
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <div>구현 예정 - 모듈화된 컴포넌트</div>
    </div>
  </div>
);

export const SettingsDemo = () => (
  <div className="demo-card">
    <h3>⚙️ Settings Demo</h3>
    <p className="demo-description">계층형 설정 관리와 기본값 복원 기능을 보여주는 설정 데모</p>
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <div>구현 예정 - 모듈화된 컴포넌트</div>
    </div>
  </div>
);

export const ProductCatalogDemo = () => (
  <div className="demo-card">
    <h3>📦 Product Catalog Demo</h3>
    <p className="demo-description">동적 재고 관리와 카테고리 필터링을 보여주는 상품 카탈로그 데모</p>
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <div>구현 예정 - 모듈화된 컴포넌트</div>
    </div>
  </div>
);

export const NotificationDemo = () => (
  <div className="demo-card">
    <h3>🔔 Notification Demo</h3>
    <p className="demo-description">이벤트 기반 알림과 읽음 상태 관리를 보여주는 알림 시스템 데모</p>
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <div>구현 예정 - 모듈화된 컴포넌트</div>
    </div>
  </div>
);