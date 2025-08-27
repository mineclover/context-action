---
document_id: ko_guide_llms-cli-reference
category: guide
source_path: ko/guide/llms-cli-reference.md
character_limit: 1000
last_update: '2025-08-27T05:45:48.449Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
LLMS Generator CLI 명령어 참조

LLMS Generator CLI 명령어 참조 다국어 문서 처리 기능을 포함한 LLMS Generator CLI 시스템의 완전한 명령어 참조서입니다. 🎯 빠른 이해 (30초) LLMS Generator는? 긴 문서를 7가지 길이(100자5000자)로 자동 요약하는 시스템 동작 원리: 가장 많이 쓰는 명령어: --- ::: tip 📖 종합 구현 참조서 모든 CLI 기능, 아키텍처 세부사항, 고급 워크플로우를 다루는 상세한 구현 문서는 종합 구현 참조서를 참조하세요. ::: 핵심 명령어 문서 처리 sync-docs 변경된 문서 파일을 자동으로 처리하고 우선순위 메타데이터와 함께 템플릿을 생성합니다. 옵션: - --changed-files <files>: 쉼표로 구분된 변경된 마크다운 파일 목록 - --only-kore

Key points:
• `--changed-files <files>`: 쉼표로 구분된 변경된 마크다운 파일 목록
• `--only-korean`: 한국어 문서만 처리 🇰🇷
• `--only-english`: 영어 문서만 처리 🇺🇸
• `--languages <langs>`: 쉼표로 구분된 특정 언어들 처리
• `--include-korean` / `--no-korean`: 한국어 문서 처리 제어
•...