---
document_id: guide--llms-cli-comprehensive-reference
category: guide
source_path: ko/guide/llms-cli-comprehensive-reference.md
character_limit: 2000
last_update: '2025-08-21T13:34:01.940Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
LLMS Generator CLI - 종합 구현 참조서

LLMS Generator 시스템의 모든 구현된 CLI 명령어와 기능에 대한 완전한 문서입니다. 개요

LLMS Generator CLI는 다국어 문서 관리, 우선순위 시스템, 자동화된 템플릿 생성을 위한 종합적인 도구 모음을 제공합니다. 이 문서는 구현된 모든 기능, 명령어, 워크플로우를 다룹니다. 아키텍처

핵심 구성 요소
- Command Router: 중앙 명령 디스패치 시스템 (/src/cli/index.ts)
- Command Implementations: /src/cli/commands/의 개별 명령 클래스들
- Configuration Management: EnhancedLLMSConfig를 사용한 향상된 설정 시스템
- Help System: 대화형 도움말 표시 (HelpDisplay.ts)
- Error Handling: 중앙화된 오류 관리 (ErrorHandler.ts)
- Argument Parsing: 통합 인수 처리 (ArgumentParser.ts)

구현 통계
- 총 명령어 수: 13개 핵심 명령어
- NPM 스크립트: 25+ 편의 스크립트
- 지원 언어: 영어, 한국어
- 파일 처리: Markdown → Priority JSON → Templates → LLMS
- 코드 축소: 2000줄에서 200줄 핵심 구현으로 최적화

전체 명령어 참조

프로젝트 초기화

init - 완전한 프로젝트 설정
전체 발견 및 설정과 함께 새 프로젝트에서 LLMS Generator를 초기화합니다. 구현: InitCommand.ts
NPM 스크립트: pnpm llms:init

옵션:
- --dry-run: 변경사항을 만들지 않고 초기화 미리보기
- --overwrite: 기존 설정 및 우선순위 파일 덮어쓰기
- --quiet: 상세 출력 억제
- --skip-priority: priority.json 파일 생성 건너뛰기
- --skip-templates: 템플릿 파일 생성 건너뛰기
- -l, --language <lang>: 기본 언어 설정 (en, ko)

처리 단계:
1. 문서 발견: docs/ 디렉토리에서 모든 .md 파일 스캔
2. 우선순위 생성: 메타데이터 분석으로 priority.json 파일 생성
3. 템플릿 생성: 모든 글자 수 제한에 대한 템플릿 파일 생성
4. 설정 구성: llms-generator.config.json 생성 또는 업데이트

출력 예시:

워크플로우 관리

work-next - 우선순위 기반 작업 큐
다음에 작업할 문서 항목을 찾거나 상위 N개 우선순위 문서를 표시합니다. 구현: WorkNextCommand.ts
NPM 스크립트: 
- pnpm llms:work-next
- pnpm llms:work-top10
- pnpm llms:work-top20

옵션:
- -l, --language <lang>: 언어별 필터링 (en, ko)
- --show-completed: 결과에 완료된 항목 포함
- -v, --verbose: 우선순위 점수를 포함한 상세 정보 표시
- -n, --limit <number> / --top <number>: 상위 N개 우선순위 문서 표시
- --sort-by <field>: priority (기본값), category, status, modified로 정렬
- --category <cat>: 특정 카테고리별 필터링
- -c, --character-limit <num>: 글자 수 제한별 필터링

출력 형식:

우선순위 관리 시스템

priority-stats - 우선순위 분포 분석
모든 문서에 걸친 종합적인 우선순위 분포 통계를 표시합니다.
