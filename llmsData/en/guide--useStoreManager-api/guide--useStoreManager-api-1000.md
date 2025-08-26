---
document_id: guide--useStoreManager-api
category: guide
source_path: en/guide/patterns/store/useStoreManager-api.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.328Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
useStoreManager API

The useStoreManager hook provides low-level access to the internal StoreManager instance for advanced store management scenarios in the Declarative Store Pattern. Prerequisites

For basic store setup and context creation, see Basic Store Setup. This document demonstrates API usage using the store setup:
- Store configuration → Type Inference Configurations
- Context creation → Single Domain Store Context

Basic Usage

Getting Store Manager

Store Operations

API Reference

manager.getStore(storeName)

Get a typed store instance by name. This is the primary method for accessing stores.
