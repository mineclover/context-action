---
document_id: guide--llms-cli-comprehensive-reference
category: guide
source_path: ko/guide/llms-cli-comprehensive-reference.md
character_limit: 1000
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
전체 발견 및 설정과 함께 새 프로젝트에서 LLMS Generator를 초기화합니다.
