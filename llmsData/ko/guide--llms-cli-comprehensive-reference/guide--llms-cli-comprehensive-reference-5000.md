---
document_id: guide--llms-cli-comprehensive-reference
category: guide
source_path: ko/guide/llms-cli-comprehensive-reference.md
character_limit: 5000
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
모든 문서에 걸친 종합적인 우선순위 분포 통계를 표시합니다. 구현: PriorityManagerCommand.ts
NPM 스크립트: pnpm priority

출력 포함 사항:
- 총 문서 수 및 평균 우선순위 점수
- 우선순위 등급별 분포 (Critical: 90-100, High: 75-89, Medium: 50-74, Low: 0-49)
- 카테고리 및 언어별 분석
- 통계적 지표 (범위, 표준편차, 사분위수)
- 건강 지표 및 추세 분석

샘플 출력:

priority-health - 우선순위 시스템 건강 점검
우선순위 일관성을 평가하고 시스템적 문제를 식별합니다. 구현: PriorityManagerCommand.ts
NPM 스크립트: pnpm llms:priority-health

건강 점수 시스템:
- 우수 (85-100): 균형 잡히고 일관된 우선순위
- 양호 (70-84): 경미한 불일치, 쉽게 해결 가능  
- 보통 (50-69): 주목할 만한 문제, 주의 필요
- 불량 (0-49): 즉시 조치가 필요한 심각한 문제

평가 요소:
- 우선순위 분포 균형
- 카테고리 일관성
- 언어 균등성
- 이상치 탐지
- 시간적 일관성
- 콘텐츠-우선순위 정렬

priority-suggest - 지능형 권장사항
우선순위 시스템 개선을 위한 실행 가능한 권장사항을 제공합니다. 구현: PriorityManagerCommand.ts
NPM 스크립트: pnpm llms:priority-suggest

제안 카테고리:
- 우선순위 재조정 권장사항
- 콘텐츠 격차 식별
- 카테고리 표준화 제안
- 언어 균등성 개선사항
- 템플릿 완료 우선순위

priority-auto - 자동화된 우선순위 재계산
설정 가능한 기준에 따라 우선순위를 자동으로 재계산합니다. 구현: PriorityManagerCommand.ts
NPM 스크립트: pnpm llms:priority-auto

기본 기준 가중치:
- 문서 크기: 40%
- 카테고리 중요도: 30%
- 키워드 밀도: 20%
- 관계 복잡성: 10%

priority-tasks - 우선순위 파일 관리
priority.json 파일 자체를 관리하고 분석 - 누락되거나 오래되거나 잘못된 우선순위 파일을 찾습니다. 구현: PriorityTasksCommand.ts
NPM 스크립트: 
- pnpm llms:priority-tasks
- pnpm llms:priority-tasks:fix

작업 유형:
- 🔴 missing: 문서에 대한 priority.json 파일이 누락됨
- ❌ invalid: JSON 구문 오류 또는 필수 필드 누락
- 🟡 outdated: priority.json 이후에 소스 문서가 수정됨
- 🟠 needsreview: 우선순위 점수가 카테고리 기준과 맞지 않음  
- 🔵 needsupdate: 메타데이터가 불완전하거나 개선이 필요함

옵션:
- -l, --language <lang>: 언어별 필터링
- --category <cat>: 카테고리별 필터링
- --task-type <type>: 특정 작업 유형별 필터링
- -n, --limit <num>: 결과 수 제한
- -v, --verbose: 상세 정보 표시
- --fix: 감지된 문제 자동 수정
- --dry-run: 변경사항을 만들지 않고 미리보기

자동 수정 기능:
- 누락된 파일: 계산된 점수로 priority.json 생성
- 잘못된 JSON: 구문 오류 수정, 누락된 필수 필드 추가
- 오래된 파일: 타임스탬프 및 메타데이터 업데이트
- 검토 문제: 우선순위 점수 조정 제안
- 업데이트 작업: 메타데이터 완성도 향상

문서 처리

sync-docs - 문서 동기화
변경된 문서 파일을 자동으로 처리하고 우선순위 메타데이터와 함께 템플릿을 생성합니다. 구현: SyncDocsCommand.ts
NPM 스크립트: 
- pnpm llms:sync-docs
- pnpm llms:sync-docs:ko
- pnpm llms:sync-docs:en  
- pnpm llms:sync-docs:dry

옵션:
- --changed-files <files>: 쉼표로 구분된 변경된 마크다운 파일 목록
- --only-korean: 한국어 문서만 처리 🇰🇷
- --only-english: 영어 문서만 처리 🇺🇸
- --languages <langs>: 특정 쉼표로 구분된 언어 처리
- --include-korean / --no-korean: 한국어 문서 처리 제어
- --dry-run: 수정하지 않고 변경사항 미리보기
- --force: 최소 변경사항이 감지되어도 강제 업데이트
- --quiet: 자동화를 위한 상세 출력 억제

처리 워크플로우:
1. 파일 분석: 파일 경로 패턴에서 언어 감지
2. 변경 감지: 기존 priority.json 타임스탬프와 비교
3. 우선순위 계산: 우선순위 점수를 위한 콘텐츠 분석
4. 템플릿 생성: 글자 수 제한 템플릿 생성
5. 메타데이터 업데이트: 새로운 정보로 priority.json 업데이트

generate-templates - 템플릿 생성 시스템
기존 문서에 대한 글자 수 제한 템플릿을 생성합니다. 구현: GenerateTemplatesCommand.ts
NPM 스크립트: pnpm llms:generate-templates

옵션:
- -l, --language <lang>: 대상 언어 (en, ko)
- --category <category>: 특정 문서 카테고리
- --character-limits <limits>: 쉼표로 구분된 글자 수 제한
- --overwrite: 기존 템플릿 덮어쓰기
- --dry-run: 파일 생성 없이 미리보기
- -v, --verbose: 파일 경로가 포함된 상세 출력

템플릿 유형:
- 표준 템플릿: 100, 200, 300, 500, 1000, 2000, 5000 글자 수 제한
- 사용자 정의 제한: 사용자 구성 가능한 글자 수 제한
- 콘텐츠 보존: 소스 형식 및 구조 유지
- 메타데이터 통합: 우선순위 및 카테고리 정보 포함

LLMS 생성

llms-generate - 표준 LLMS 파일 생성
학습 목적을 위해 메타데이터가 포함된 표준 LLMS 파일을 생성합니다.
