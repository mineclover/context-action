export function HomePage() {
  return (
    <div>
      <h1>Context Action Library Test Suite</h1>
      <p>
        이 애플리케이션은 Context Action 라이브러리의 다양한 기능과 시나리오를
        테스트하기 위한 환경입니다.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '30px',
        }}
      >
        <div
          style={{
            padding: '20px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
          }}
        >
          <h3>🔧 Core Library</h3>
          <p>기본적인 액션 시스템과 핵심 기능들을 테스트합니다.</p>
          <ul>
            <li>
              <strong>Basics:</strong> 기본 액션 생성과 디스패치
            </li>
            <li>
              <strong>Advanced:</strong> 미들웨어, 인터셉터, 복잡한 패턴
            </li>
            <li>
              <strong>Performance:</strong> 성능 최적화와 벤치마크
            </li>
          </ul>
        </div>

        <div
          style={{
            padding: '20px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
          }}
        >
          <h3>⚛️ React Integration</h3>
          <p>React 생태계와의 통합 기능들을 테스트합니다.</p>
          <ul>
            <li>
              <strong>Basics:</strong> 기본 React 훅과 컨텍스트
            </li>
            <li>
              <strong>Hooks:</strong> 커스텀 훅과 상태 관리
            </li>
            <li>
              <strong>Context:</strong> 복잡한 컨텍스트 시나리오
            </li>
            <li>
              <strong>Forms:</strong> 폼 처리와 유효성 검사
            </li>
          </ul>
        </div>

        <div
          style={{
            padding: '20px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
          }}
        >
          <h3>🗂️ Jotai Integration</h3>
          <p>Jotai 상태 관리와의 통합 기능들을 테스트합니다.</p>
          <ul>
            <li>
              <strong>Basics:</strong> Jotai 아톰과 액션 연동
            </li>
            <li>
              <strong>Async:</strong> 비동기 작업과 상태 관리
            </li>
            <li>
              <strong>Persistence:</strong> 상태 지속성과 저장
            </li>
          </ul>
        </div>
      </div>

      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <h3>🚀 시작하기</h3>
        <p>
          좌측 네비게이션에서 원하는 카테고리를 선택하여 다양한 테스트
          시나리오를 확인해보세요. 각 페이지는 실제 동작하는 예제와 함께
          라이브러리의 기능을 보여줍니다.
        </p>
      </div>
    </div>
  );
}
