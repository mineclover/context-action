LLMS Generator - Architecture & Implementation Guide

LLMS Generator - Architecture & Implementation Guide System Architecture The LLMS Generator is a TypeScript library for processing documentation and generating optimized content for LLM consumption. This guide provides comprehensive architecture details and implementation patterns. Core Components 1. Document Processing Pipeline 2. Clean Architecture Implementation The system follows Clean Architecture principles: - Entities: CoreTypes (Document, WorkItem, Priority metadata) - Use Cases: Commands (WorkNextCommand, LLMSGenerateCommand, PriorityTasksCommand) - Interface Adapters: CLI Adapters - Frameworks & Drivers: CLI entry point, File system 3. Directory Structure Design Patterns Applied 1. Factory Pattern - CommandFactory: Creates command instances based on user input - Enables easy addition of new commands without modifying core logic 2. Adapter Pattern - Adapts existing command implementations to new interfaces - Maintains backward compatibility while improving architecture 3. Strategy Pattern - Document Selection Strategies: Balanced, Greedy, Hybrid, Quality-focused, Diverse - Allows runtime algorithm selection based on requirements 4. Dependency Injection - Commands receive c

Key points:
• **Entities**: CoreTypes (Document, WorkItem, Priority metadata)
• **Use Cases**: Commands (WorkNextCommand, LLMSGenerateCommand, PriorityTasksCommand)
• **Interface Adapters**: CLI Adapters
• **Frameworks & Drivers**: CLI entry point, File system
• **CommandFactory**: Creates command instances based on user input
• Enables easy addition of new commands without modifying core logic
• Adapts existing command implementations to new interfaces
• Maintains backward compatibility while improving architecture
• **Document Selection Strategies**: Balanced, Greedy, Hybrid, Quality-focused, Diverse
• Allows runtime algorithm selection based on requirements
• Commands receive configuration through constructor injection
•...