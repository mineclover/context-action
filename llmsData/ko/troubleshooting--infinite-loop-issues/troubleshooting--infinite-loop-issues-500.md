---
document_id: troubleshooting--infinite-loop-issues
category: troubleshooting
source_path: ko/troubleshooting/infinite-loop-issues.md
character_limit: 500
last_update: '2026-11-21T03:32:50.157Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
무한 루프 문제 해결

무한 루프 문제 해결 Context-Action 프레임워크에서 발생할 수 있는 대표적인 무한 루프 원인과 해결 패턴을 정리합니다. 🔄 개요 무한 루프는 상태 관리 시스템에서 가장 치명적인 장애 중 하나이며, 주로 액션 디스패치, 상태 업데이트, 사이드 이펙트 간의 순환 의존성 때문에 발생합니다. 이 문서에서는 주요 무한 루프 패턴과 예방 전략을 다룹니다. 🚨 ActionLogger + onDataChanged 순환 루프 문제 상황 증상: - 연속적인 사용자 인터랙션 직후 애플리케이션이 멈춤 - 콘솔에 동일한 액션 디스패치가 끝없

Key points:
• 연속적인 사용자 인터랙션 직후 애플리케이션이 멈춤
• 콘솔에 동일한 액션 디스패치가 끝없이 출력됨
• 스택 오버플로 오류 또는 브라우저 응답 없음 상태 발생
• 메모리 사용량이 계속 증가함
• `maxToasts` 한도에 도달하는 순간 애플리케이션이 정지함