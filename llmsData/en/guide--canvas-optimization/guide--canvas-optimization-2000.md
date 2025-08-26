---
document_id: guide--canvas-optimization
category: guide
source_path: en/guide/patterns/ref/canvas-optimization.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.287Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Canvas Performance Optimization

High-performance Canvas patterns with RefContext for 60fps+ interactions. Prerequisites

Required Setup: Before using these Canvas optimization patterns, you need to set up RefContext with Canvas types. Setup Reference: RefContext Setup Guide - See "Canvas and Graphics Refs" section for complete type definitions and provider setup patterns. 🎨 Live Example

→ Try the Canvas Demo

Experience the optimized Canvas implementation in action. The demo showcases all performance patterns described in this guide:
- Immediate visual feedback for drawing tools
- Dual-canvas architecture for smooth interactions  
- Real-time freehand drawing with zero lag
- 60fps+ performance across all tools

Local Development: http://localhost:4000/refs/canvas

Core Performance Pattern: Immediate Visual Feedback

The fundamental pattern for high-performance Canvas interactions is immediate visual feedback that bypasses React's state update cycle. ✅ Immediate Canvas Update Pattern

Key Benefits:
- ⚡ Zero Lag: <16ms visual response time
- 🎯 60fps Performance: No frame drops during interactions
- 🔄 Non-blocking: State updates don't affect visual feedback
- 📈 Scalable: Performance remains consistent with complex shapes

Essential Performance Patterns

1. Selective Canvas Updates Pattern

Optimize mouse interactions by separating preview updates from persistent rendering:

Performance Gain: 50-80% reduction in rendering operations

2. Dual-Canvas Architecture Pattern

Separate persistent content from temporary previews for optimal performance:

Architecture Benefits:
- Performance Isolation: Main canvas unaffected by preview operations
- Optimized Rendering: Each canvas serves specific purpose
- Zero Interference: Layered architecture with no performance penalties

3.
