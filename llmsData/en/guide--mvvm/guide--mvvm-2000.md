---
document_id: guide--mvvm
category: guide
source_path: en/guide/architecture/mvvm.md
character_limit: 2000
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
6. Action-Based File Convention - 선언적 스펙 기반 관리
   - Folder Structure Convention
   - Action Hook Implementation
   - Component Usage Patterns

🔑 Handler ID Management
7. HandlerId Core Benefits - 함수 고유성과 생명주기 관리
8. ActionRegister Direct Usage - 수동 등록과 ID 주입 전략
9. Override Patterns - 명시적 언마운트를 통한 핸들러 교체

🚀 Advanced Patterns
10. Multi-Domain MVVM - 다중 도메인 아키텍처
11. Cross-Domain Communication - 도메인 간 통신
12. Auto-Registration System - 자동 훅 등록 시스템

📖 Best Practices & Guidelines
13. Best Practices - 레이어 분리와 통신 패턴
14. Architecture Comparison - MVVM vs Domain 선택 가이드

---

Architecture Overview

MVVM Layer Structure

Core Architecture Flow

Implementation Patterns

Context Definition (Types & Context Creation)

Data Subscription Hooks (모듈화된 데이터 구독)

Action Hooks (지연 평가 및 핸들러 정의)

Performance Layer Implementation

Pure View Layer (순수하게 데이터와 함수를 받아서 렌더링)

Complete MVVM Application Setup

Action-Based File Convention System

선언적 스펙 기반 관리 시나리오

폴더 구조 컨벤션

액션별 훅 구현 패턴 (선택적 구독 & 지연 평가)

핸들러 ID 전략 및 다중 등록 패턴

HandlerId 기반 관리의 핵심 장점

1. 함수 고유성 보장 및 생명주기 관리

2. 컴포넌트 마운트/언마운트 시 안정적 정리

3.
