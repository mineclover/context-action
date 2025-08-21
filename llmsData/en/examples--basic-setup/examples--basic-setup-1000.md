---
document_id: examples--basic-setup
category: examples
source_path: en/examples/basic-setup.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.354Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Basic Setup

This example shows the fundamental setup of Context-Action framework with both Action Only and Store Only patterns. Installation

First, install the required packages:

Project Structure

Step 1: Define Action Types

Create type definitions for your actions:

Step 2: Create Action Context

Set up the Action Only pattern for business logic:

Step 3: Create Store Pattern

Set up the Store Only pattern for state management:

Step 4: Main Application Setup

Combine both patterns in your main app component:

Step 5: User Profile Component

Example component using both patterns:

Step 6: Event Logger Component

Component that handles event tracking:

Step 7: Basic Styles

Add some basic CSS for the example:

Key Concepts Demonstrated

This example demonstrates several key Context-Action concepts:

1. Pattern Separation
- Action Only Pattern for business logic and events
- Store Only Pattern for state management
- Clear separation between actions and state

2.
