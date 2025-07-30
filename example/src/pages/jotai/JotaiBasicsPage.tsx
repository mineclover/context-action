export function JotaiBasicsPage() {
  return (
    <div>
      <h1>Jotai Integration - Basics</h1>
      <p>
        Jotai 아톰과 Context Action의 기본적인 통합을 보여줍니다. 
        (현재 jotai 패키지 구현 중)
      </p>

      <div
        style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          marginTop: '20px',
        }}
      >
        <h3>🚧 Coming Soon</h3>
        <p>이 페이지는 현재 개발 중입니다. jotai 패키지가 완성되면 다음 기능들이 추가될 예정입니다:</p>
        <ul>
          <li>Jotai 아톰과 액션 연동</li>
          <li>아톰 기반 상태 관리</li>
          <li>파생 아톰 활용</li>
          <li>액션을 통한 아톰 업데이트</li>
          <li>아톰 구독과 액션 디스패치</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>권장 사용 패턴</h3>
        <pre style={{ overflow: 'auto', fontSize: '14px' }}>
{`import { createAtomContext } from '../core/createAtomContext'

// 간편하게 카운터 컨텍스트 생성
export const {
  Provider: CounterProvider,
  useAtomState: useCounter,
  useAtomReadOnly: useCounterValue,
  useAtomSetter: useCounterSetter,
  useAtomSelect: useCounterSelect,
} = createAtomContext(0)`}
        </pre>
      </div>
    </div>
  );
}