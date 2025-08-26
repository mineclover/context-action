---
document_id: guide--register-delegation
category: guide
source_path: en/guide/patterns/action/register-delegation.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.319Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Register Delegation Pattern

Advanced pattern for organizing action handlers in separate modules using external functions and useActionRegister() hook. Import

Features
- ✅ Modular handler organization
- ✅ External function delegation
- ✅ Team-based development support
- ✅ Plugin architecture enablement
- ✅ Cleanup management

Prerequisites

🎯 스펙 재사용: For complete setup instructions including type definitions, context creation, and provider configuration, see Basic Action Setup. 📖 이 문서의 모든 예제는 아래 setup 스펙을 재사용합니다:
- 🎯 Action types → EventActions Pattern
- 🎯 Context creation → Single Domain Context
- 🎯 Provider setup → Single Provider Setup

💡 일관된 학습: Setup 가이드를 먼저 읽으면 이 문서의 모든 예제를 즉시 이해할 수 있습니다. Overview

Register delegation enables modular handler organization by separating handler logic into external modules. This pattern is essential for large applications with complex business logic, team-based development, and plugin architectures.
