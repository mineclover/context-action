---
document_id: guide--llms-cli-reference
category: guide
source_path: ko/guide/llms-cli-reference.md
character_limit: 1000
last_update: '2025-08-21T13:34:01.941Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
LLMS Generator CLI 명령어 참조

다국어 문서 처리 기능을 포함한 LLMS Generator CLI 시스템의 완전한 명령어 참조서입니다. ::: tip 📖 종합 구현 참조서
모든 CLI 기능, 아키텍처 세부사항, 고급 워크플로우를 다루는 상세한 구현 문서는 종합 구현 참조서를 참조하세요. :::

핵심 명령어

문서 처리

sync-docs

변경된 문서 파일을 자동으로 처리하고 우선순위 메타데이터와 함께 템플릿을 생성합니다. 옵션:
- --changed-files <files>: 쉼표로 구분된 변경된 마크다운 파일 목록
- --only-korean: 한국어 문서만 처리 🇰🇷
- --only-english: 영어 문서만 처리 🇺🇸
- --languages <langs>: 쉼표로 구분된 특정 언어들 처리
- --include-korean / --no-korean: 한국어 문서 처리 제어
- --dry-run: 수정 없이 변경사항 미리보기
- --force: 최소 변경사항이라도 강제 업데이트
- --quiet: 상세 출력 억제

generate-templates

기존 문서에 대한 글자 수 제한 템플릿을 생성합니다. 옵션:
- -l, --language <lang>: 대상 언어 (en, ko)
- --category <category>: 특정 문서 카테고리
- --character-limits <limits>: 쉼표로 구분된 글자 수 제한
- --overwrite: 기존 템플릿 덮어쓰기
- --dry-run: 파일 생성 없이 미리보기
- -v, --verbose: 상세 출력

우선순위 관리

priority-stats

포괄적인 우선순위 분포 통계를 표시합니다.
