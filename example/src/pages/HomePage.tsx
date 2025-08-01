export function HomePage() {
  const cardStyle = {
    padding: '24px',
    border: '1px solid #e9ecef',
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  const badgeStyle = {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '12px',
    marginLeft: '8px'
  };

  const difficultyBadge = (level: string) => ({
    ...badgeStyle,
    backgroundColor: level === '기초' ? '#e3f2fd' : level === '중급' ? '#fff3e0' : '#fce4ec',
    color: level === '기초' ? '#1976d2' : level === '중급' ? '#f57c00' : '#c2185b'
  });

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Context Action Library
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#64748b', 
          maxWidth: '600px', 
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          액션 파이프라인과 상태 관리를 통합한 타입 안전한 아키텍처 솔루션
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              🔧 Core Library
            </h3>
            <span style={difficultyBadge('기초')}>기초</span>
          </div>
          <p style={{ color: '#64748b', marginBottom: '20px', lineHeight: '1.6' }}>
            순수 JavaScript/TypeScript 환경에서 동작하는 액션 파이프라인 시스템
          </p>
          
          <div style={{ fontSize: '14px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#1e293b' }}>핵심 데모:</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.8' }}>
              <li><strong>액션 등록/디스패치:</strong> 타입 안전한 액션 시스템</li>
              <li><strong>우선순위 파이프라인:</strong> 핸들러 실행 순서 제어</li>
              <li><strong>성능 벤치마크:</strong> 대량 액션 처리 최적화</li>
              <li><strong>MVVM 통합:</strong> Store와 Action의 완전한 통합</li>
            </ul>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              ⚛️ React Integration
            </h3>
            <span style={difficultyBadge('중급')}>중급</span>
          </div>
          <p style={{ color: '#64748b', marginBottom: '20px', lineHeight: '1.6' }}>
            React 생태계와의 완벽한 통합으로 컴포넌트 간 통신을 혁신
          </p>
          
          <div style={{ fontSize: '14px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#1e293b' }}>핵심 데모:</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.8' }}>
              <li><strong>컨텍스트 통신:</strong> 컴포넌트 간 액션 브로드캐스팅</li>
              <li><strong>훅 최적화:</strong> 메모이제이션과 성능 패턴</li>
              <li><strong>액션 가드:</strong> 디바운싱, 스로틀링 제어</li>
              <li><strong>스토어 시스템:</strong> 8가지 실제 애플리케이션 시나리오</li>
            </ul>
          </div>
        </div>

        <div style={{...cardStyle, opacity: 0.7}}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              🗂️ Jotai Integration
            </h3>
            <span style={{...badgeStyle, backgroundColor: '#f3f4f6', color: '#6b7280'}}>
              개발 예정
            </span>
          </div>
          <p style={{ color: '#64748b', marginBottom: '20px', lineHeight: '1.6' }}>
            Jotai의 아톰 기반 상태 관리와 액션 파이프라인의 혁신적 결합
          </p>
          
          <div style={{ fontSize: '14px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#1e293b' }}>예정 데모:</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.8', color: '#9ca3af' }}>
              <li><strong>아톰 연동:</strong> createAtomContext 패턴</li>
              <li><strong>비동기 처리:</strong> async 아톰과 서버 상태</li>
              <li><strong>상태 지속성:</strong> localStorage 통합</li>
              <li><strong>의존성 추적:</strong> 자동 리렌더링 최적화</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{
        padding: '32px',
        backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '16px',
        textAlign: 'center'
      }}>
        <h3 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#1e293b'
        }}>
          🎯 데모로 배우는 아키텍처
        </h3>
        <p style={{ 
          color: '#475569', 
          fontSize: '16px',
          maxWidth: '700px',
          margin: '0 auto 24px',
          lineHeight: '1.7'
        }}>
          각 데모는 실제 동작하는 코드와 함께 핵심 개념을 보여줍니다.<br/>
          단순한 예제가 아닌, 실제 프로덕션에서 사용할 수 있는 패턴들을 경험해보세요.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '24px'
        }}>
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧪</div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>인터랙티브 데모</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>실시간 동작 확인</div>
          </div>
          
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>성능 메트릭</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>실시간 벤치마크</div>
          </div>
          
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>코드 분석</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>동작 원리 설명</div>
          </div>
          
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏗️</div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>실제 시나리오</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>프로덕션 패턴</div>
          </div>
        </div>
      </div>
    </div>
  );
}
