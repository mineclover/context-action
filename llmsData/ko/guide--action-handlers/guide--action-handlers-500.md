---
document_id: guide--action-handlers
category: guide
source_path: ko/guide/action-handlers.md
character_limit: 500
last_update: 2025-08-18T01:30:00Z
update_status: template_generated
priority_score: 95
priority_tier: essential
completion_status: completed
workflow_stage: published
---

# 액션 핸들러 (500자)

## 템플릿 내용 (500자 이내)

```markdown
액션 핸들러는 애플리케이션의 비즈니스 로직을 포함하는 핵심 구성요소로, Context-Action 프레임워크에서 확장 가능하고 유지보수가 가능한 애플리케이션을 구축하는 데 중요한 역할을 합니다. 

권장되는 구현 패턴은 useActionHandler + useEffect 조합으로, 최적의 성능과 적절한 정리를 보장합니다. 재등록을 방지하기 위해 핸들러를 useCallback으로 감싸고, stores 지연 평가를 통해 현재 상태를 읽습니다. 

핸들러 내에서는 페이로드 검증, 비즈니스 로직 처리, 상태 업데이트를 순차적으로 수행하며, controller를 통해 에러 처리, 결과 반환, 파이프라인 제어를 관리합니다. 컴포넌트와 완전히 분리된 로직으로 재사용성과 테스트 용이성을 극대화하며, 복잡한 애플리케이션 요구사항을 효율적으로 처리할 수 있는 확장 가능한 아키텍처를 제공합니다.
```