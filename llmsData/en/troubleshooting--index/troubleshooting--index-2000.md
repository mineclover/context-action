---
document_id: troubleshooting--index
category: troubleshooting
source_path: en/troubleshooting/index.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.259Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Troubleshooting Guide

Troubleshooting Guide Comprehensive troubleshooting resources for the Context-Action framework. 🚨 Critical Issues Infinite Loop Issues 🆕 - ActionLogger + onDataChanged infinite loops - Toast system infinite loops - Action handler re-registration loops - Timer cascade loops - Store update loops Performance Issues - Memory management and optimization - Excessive re-renders prevention - Bundle size optimization - Selective subscription patterns Action System Issues - Handler state access problems - Stale closures in handlers - Action registration patterns Store & State Issues - Memory leak prevention - Event object storage - Circular reference detection - Store comparison strategies Ref System Issues - Unresolved refs - Mount timeout problems - RefContext debugging 🔧 Quick Fixes Most Common Issues App Freezing After Consecutive Actions Symptoms: App becomes unresponsive after 4-5 rapid actions, continuous HMR updates Quick Fix: Check infinite-loop-issues.md for all infinite loop patterns Ci

Key points:
• ActionLogger + onDataChanged infinite loops
• Toast system infinite loops
• Action handler re-registration loops
• Timer cascade loops
• Store update loops
• Memory management and optimization
• Excessive re-renders prevention
• Bundle size optimization
• Selective subscription patterns
• Handler state access problems
• Stale closures in handlers
• Action registration patterns
• Memory leak prevention
• Event object storage
• Circular reference detection
• Store comparison strategies