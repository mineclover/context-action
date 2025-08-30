---
document_id: en_troubleshooting_performance-issues
category: troubleshooting
source_path: en/troubleshooting/performance-issues.md
character_limit: 1000
last_update: '2025-08-30T10:42:13.660Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Performance Issues

Performance Issues Performance optimization and troubleshooting for the Context-Action framework. 🚨 Important Note For infinite loop issues, see the dedicated guide: → Infinite Loop Issues - Comprehensive coverage of all infinite loop patterns and solutions ⚡ Performance Optimization Memory Management Event Object Storage Prevention Issue: DOM event objects being stored in stores caus

Key points:
• Components subscribing to stores with high-frequency updates
• UI becomes unresponsive during rapid state changes
• Performance degradation with large component trees
• [ ] All `setTimeout` calls have corresponding...