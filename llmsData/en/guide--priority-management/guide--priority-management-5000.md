---
document_id: guide--priority-management
category: guide
source_path: en/guide/priority-management.md
character_limit: 5000
last_update: '2025-08-21T13:34:01.922Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Priority Management System

The Priority Management System provides automated tools for analyzing, maintaining, and optimizing documentation priorities in the LLMS Generator framework. Overview

Problem Statement

Traditional documentation management faces several challenges:
- Manual Priority Assignment: Subjective priority scoring leads to inconsistency
- Team Coordination: Difficulty tracking who's working on what
- Priority Drift: Priorities become outdated without systematic review
- Scalability Issues: Manual management doesn't scale with growing documentation

Solution Architecture

The Priority Management System provides:
- Automated Analysis: Statistical insights into priority distribution
- Health Monitoring: Consistency checks and variance detection
- Smart Suggestions: Data-driven recommendations for improvement
- Team Collaboration: Foundation for external server integration

Quick Start

Basic Commands

Example Output

Commands Reference

priority-stats

Analyzes priority distribution across your documentation. Output includes:
- Total document count and average priority score
- Distribution by priority tier (critical, high, medium, low)
- Breakdown by category and language
- Statistical measures (range, standard deviation)

priority-health

Evaluates priority consistency and identifies issues. Health Scoring:
- Excellent (85-100): Well-balanced, consistent priorities
- Good (70-84): Minor inconsistencies, easily addressed
- Fair (50-69): Noticeable issues requiring attention
- Poor (0-49): Significant problems needing immediate action

Common Issues Detected:
- High priority variance (standard deviation > 25)
- Similar scores across all documents (range < 20)
- Uneven category distribution (variance > 50)
- Language inconsistencies (variance > 30)

priority-suggest

Provides actionable recommendations based on current state. Suggestions include:
- Immediate actions for poor health scores
- Standardization recommendations
- Document-specific guidance
- Next steps for improvement

priority-auto

Automatically recalculates priorities based on defined criteria.
