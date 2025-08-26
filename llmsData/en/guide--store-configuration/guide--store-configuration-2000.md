---
document_id: guide--store-configuration
category: guide
source_path: en/guide/patterns/store/store-configuration.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.323Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Configuration

Performance optimization and custom comparison strategies for complex store scenarios. Prerequisites

For basic store setup and configuration patterns, see Basic Store Setup. This document demonstrates advanced configuration using the Setup patterns:
- Type definitions → Common Store Patterns
- Configuration → Type Inference Configurations
- Context creation → Single Domain Store Context

Overview

Advanced configuration provides fine-grained control over store behavior, comparison strategies, and performance optimization for complex applications, built on established Setup patterns. Performance-Optimized Configuration

Comparison Strategies

Reference Strategy

Shallow Strategy

Deep Strategy

Custom Comparison Options

Ignore Keys Pattern

Custom Comparator Pattern

Debug Configuration

Performance Monitoring

Memory Optimization

Best Practices

1. Follow Setup Patterns: Use established store interfaces from Basic Store Setup
   - UserStores: User profile, preferences, and session management
   - ProductStores: Product catalog, categories, filters, and shopping cart
   - UIStores: Modal, loading, notifications, and navigation state
   - FormStores: Form data, validation, and error handling

2. Strategy Selection: Choose the most efficient comparison strategy
   - reference: For immutable data and large objects (ProductStores.catalog)
   - shallow: For simple objects with top-level changes (UserStores.profile)
   - deep: Only when necessary for nested objects (FormStores validation)

3. Type Safety: Extend Setup patterns with proper TypeScript interfaces
   - Use interface ExtendedStores extends BaseStores for extensions
   - Maintain type consistency with Setup pattern definitions

4. Ignore Irrelevant Keys: Use ignoreKeys for timestamp and metadata fields
   - Common pattern: ignoreKeys: ['timestamp', 'lastUpdated', 'sessionId']

5.
