---
document_id: guide--flow-control
category: guide
source_path: en/guide/pipeline/flow-control.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.300Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Pipeline Flow Control

Advanced flow control mechanisms for Context-Action pipeline execution, enabling dynamic pipeline management and conditional execution paths. Overview

Pipeline flow control provides sophisticated mechanisms to alter the normal sequential execution of handlers. These features enable complex business logic patterns, conditional processing, and early termination scenarios. 🔀 Priority Jumping

Dynamically redirect pipeline execution to specific priority levels based on runtime conditions. Basic Priority Jumping

Priority Jumping Use Cases

Security Escalation
- Standard authentication → Elevated security checks
- Basic validation → Comprehensive validation
- Regular processing → Administrative approval

Error Handling
- Normal flow → Error recovery handlers
- Retry logic → Fallback mechanisms
- Data validation → Error reporting

Business Logic Branching
- Standard workflow → Premium user flow
- Basic features → Advanced features
- Default processing → Custom processing

🚪 Early Return with Results

Terminate pipeline execution early while providing results to subsequent processes.
