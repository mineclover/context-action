---
document_id: concept--react-refs-guide
category: concept
source_path: en/concept/react-refs-guide.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.352Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
React Refs Management Guide

This guide covers the React Refs Management System in the Context-Action framework - a simple and safe reference management system designed for managing DOM elements, custom objects, and complex component references with type safety and lifecycle management. > ⚠️ Important: Always use createRefContext() for ref management. Direct RefStore instantiation is discouraged and only intended for internal framework use. Overview

The React Refs system provides declarative ref management with automatic cleanup, type safety, and advanced lifecycle features through the createRefContext() API.
