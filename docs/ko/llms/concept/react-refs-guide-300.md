React Refs 가이드

Context-Action의 RefContext는 React 리렌더링 없이 DOM을 직접 조작하는 고성능 패턴입니다. 실시간 인터랙션, 애니메이션, 캔버스 작업 등 60fps 성능이 중요한 시나리오에 최적화되어 있습니다.

주요 특징:
• 제로 리렌더링으로 성능 극대화
• TypeScript 완벽 지원으로 타입 안전성 보장
• GPU 가속을 위한 translate3d() 변환 내장
• 비즈니스 로직과 DOM 조작의 깔끔한 분리