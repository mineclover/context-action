---
document_id: context-layered--architecture--architecture-governance-usage
category: context-layered
source_path: ko/context-layered/architecture/architecture-governance-usage.md
character_limit: 2000
last_update: '2026-07-20T17:25:11.393Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
아키텍처 거버넌스 사용 방법

아키텍처 거버넌스 사용 방법 이 문서는 저장소 checkout부터 재현 가능한 Architecture Governance 심볼 catalog를 만드는 가장 짧은 경로를 설명합니다. 개념은 아키텍처 거버넌스 개요를, 전체 API와 계약은 package README를 참고하세요. 이 도구는 Context-Action convention을 repository-local authored rule과 evidence로 검증하는 PoC입니다. 범용 architecture analyzer나 문서 생성기로 사용하지 않으며, 작업 컨텍스트와 document binding의 심볼 컨텍스트 SSOT는 별도 패키지인 sem-doc이 유지합니다. 1. 저장소 준비 현재 PoC는 context-action workspace 안에서 실행되며 Node.js 24와 pnpm이 필요합니다. 의존성을 설치하고 CLI를 직접 실행하기 전에 governance package를 빌드합니다. workspace는 @ataraxy-labs/sem@0.21.0을 고정합니다. 기본 command resolution은 이 package의 sem 바이너리를 사용합니다. 다른 실행 파일을 테스트할 때만 SEMCOMMAND 또는 --sem-command를 지정하세요. provider가 보고하는 지원 identity는 여전히 sem 0.21.0이어야 합니다. 2. catalog 선언 다음 repository-local 파일에서 시작합니다. implementationAnchors에는 packages/foo/src/api.ts::function::createApi처럼 SEM top-level identity를 사용합니다. 심볼 이름이 바뀌거나 파일이 이동해도 capability ID는 유지합니다. 구현 옆에 역할 주석을 작성하고 같은 capability의 spec, 대표 테스트, 공개 문서를 연결합니다. 3. 검사 실행 현재 질문에 필요한 가장 좁은