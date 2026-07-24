---
document_id: troubleshooting--ref-issues
category: troubleshooting
source_path: en/troubleshooting/ref-issues.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.256Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Ref System Issues

Ref System Issues RefContext and reference management problems in the Context-Action framework. 🔗 Unresolved Refs Ref Mount Timeout Problems The Problem Issue: RefContext promises never resolving, causing memory leaks and hanging async operations. Symptoms: - Components waiting indefinitely for refs - Memory usage growing over time in development - Async operations that never complete - Console warnings about unmounted components Root Cause Refs are expected but never get set due to component lifecycle issues: The Fix Ensure proper ref registration and mounting: Ref Handler Registration Patterns Component Mount Order Issues Issue: Ref handlers registered after components that need them are already mounted. Solution: Register ref handlers before component content: 🕐 Mount Timeout Problems Ref Timeout Configuration Default Timeout Issues Issue: Default ref mount timeouts may be too short for complex components. Solution: Configure appropriate timeouts based on component complexity: Conditional Ref Mounting Issue: Refs that are conditionally rendered may never mount. 🐛 RefContext Debugging Ref State Inspection RefContext Provider Debugging 🔧 Advanced Ref Patterns Ref Collection Pattern Use Case: Managing multiple related refs. Dynamic Ref Management Use Case: Refs for dynamically created elements. 🚨 Ref System Recovery Emergency Ref Cleanup Ref Memory Leak Prevention 📋 Ref System Best Practices Ref Handler Guidelines 1. Register Early: Register ref handlers before components that use them 2. Timeout Protection: Always add timeouts to prevent hanging promises 3. Cleanup Management: Clean up refs and timeouts on component unmount 4. Error Handling: Handle ref mount failures gracefully 5. Conditional Mounting: Account for refs that may never mount Performance Considerations - Ref Caching: Avoid creating new ref handlers on each render - Cleanup Optimization: Use batch cleanup for multiple refs - Memory Monitoring: Monitor ref memory usage in development - Timeout Tuning: Set appropriate timeouts based on component complexity Testing Strategies - Mock Refs: Create mock refs for testing components - Timeout Testing: Test timeout scenarios and error handling - Memory Testing: Verify ref cleanup prevents memory leaks - Integration Testing: Test ref interactions with stores and actions

Key points:
• Components waiting indefinitely for refs
• Memory usage growing over time in development
• Async operations that never complete
• Console warnings about unmounted components
• **Ref Caching**: Avoid creating new ref handlers on each render
• **Cleanup Optimization**: Use batch cleanup for multiple refs
• **Memory Monitoring**: Monitor ref memory usage in development
• **Timeout Tuning**: Set appropriate timeouts based on component complexity
• **Mock Refs**: Create mock refs for testing components
• **Timeout Testing**: Test timeout scenarios and error handling
• **Memory Testing**: Verify ref cleanup prevents memory leaks
• **Integration Testing**: Test ref interactions with stores and actions
• **Register Early**: Register ref handlers before components that use them
• **Timeout Protection**: Always add timeouts to prevent hanging promises
• **Cleanup Management**: Clean up refs and timeouts on component unmount
• **Error Handling**: Handle ref mount failures gracefully
• **Conditional Mounting**: Account for refs that may never mount