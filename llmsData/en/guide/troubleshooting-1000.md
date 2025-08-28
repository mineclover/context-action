---
document_id: en_guide_troubleshooting
category: guide
source_path: en/guide/troubleshooting.md
character_limit: 1000
last_update: '2025-08-28T06:28:37.921Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Troubleshooting Guide

Troubleshooting Guide Common issues and solutions for the Context-Action framework. 🔧 Common Framework Issues Memory Leak Issues Event Object Storage Prevention Issue: DOM event objects being stored in stores causing memory leaks. Solution: The framework automatically detects and prevents storing event objects: Error Message:  EventBus Memory Optimization Issue: Large objects (DOM elements, React component

Key points:
• Browser DevTools shows continuous HMR updates
• Application becomes unresponsive after 4-5 consecutive actions
• Console logs show: `Current toast state: {currentToastsCount: 4, maxToasts: 4, stackIndex: 14}`
• **Timer Cleanup**:...