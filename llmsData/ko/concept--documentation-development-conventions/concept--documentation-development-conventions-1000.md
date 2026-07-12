---
document_id: concept--documentation-development-conventions
category: concept
source_path: ko/concept/documentation-development-conventions.md
character_limit: 1000
last_update: '2026-07-12T08:40:06.505Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
문서 및 개발 관리 컨벤션

문서 및 개발 관리 컨벤션 이 문서는 구현, 공개 문서, 생성 API 참조, LLM용 산출물을 일치시키기 위한 기준 문서입니다. 컨벤션의 코딩 규칙을 보완하며, 패키지별 소유권이나 릴리스 규칙을 대체하지는 않습니다. 1. 문서 소유권 | 영역 | 소유자 및 편집 규칙 | 검증 | | --- | --- | --- | | docs/en/, docs/ko/ 가이드·개념 문서 | 사람이 작성하는 원문입니다. 공개 내용은 영문·국문 페이지의 의미를 함께 맞춥니다. | pnpm docs:build | | docs/api/generated/ | 생성 API 참조입니다. TypeScript export와 JSDoc을 먼저 고치고, 출력물을 직접 고치지 말고 다시 생성합니다. | pnpm

Key points:
• 바뀐 권위 문서와 영향을 받는 생성물;
• 주장을 증명하는 구현·예제·테스트;
• 실행한 명령과 결과;
• 미번역 페이지, 사용할 수 없는 외부 자격 증명, 남은 수동 증명.
• **공개 API** — export type/JSDoc, API 참조 입력, 사용 예제, 그리고 호환성이
• **동작 또는 패턴** — canonical guide, 실행 가능한 예제, 문서의 동작을 증명하는
