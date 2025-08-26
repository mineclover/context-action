---
document_id: guide--mvvm
category: guide
source_path: en/guide/architecture/mvvm.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.310Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
MVVM Architecture

The Context-Action framework implements a modern MVVM (Model-View-ViewModel) architecture using the three core patterns. This is the recommended approach for complex applications requiring perfect separation of concerns. Key Difference from Domain Architecture: 
- MVVM: Focuses on architectural layers (Model, View, ViewModel, Performance)
- Domain Architecture: Focuses on business domains (User, Product, Order, etc.)

Both can be used together - MVVM provides the architectural structure while Domain Architecture provides business separation. 📋 Table of Contents

🏗️ Architecture Foundation
1. Architecture Overview - MVVM 레이어 구조와 흐름
2. Implementation Patterns - 각 레이어별 구현 패턴

🔧 Context & Action System
3. Context Definition - 타입과 컨텍스트 생성
4. Data Subscription Hooks - 모듈화된 데이터 구독
5. Action Hooks - 지연 평가 및 핸들러 정의

📁 File Convention System  
6.
