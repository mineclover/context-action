// ===== Handler Registry & Management System =====

export interface HandlerConfig {
  id: string;
  priority: number;
  tags: string[];
  description: string;
  category: 'environment' | 'feature' | 'permission' | 'business' | 'schedule';
  dependencies?: string[];
  environment?: string[];
  feature?: string;
  permissions?: string[];
}

export interface HandlerModule {
  name: string;
  description: string;
  category: string;
  handlers: Map<string, HandlerConfig>;
  isActive: boolean;
}

export class HandlerRegistry {
  private modules = new Map<string, HandlerModule>();
  private activeHandlers = new Map<string, HandlerConfig>();
  private executionHistory: Array<{
    handlerId: string;
    timestamp: number;
    success: boolean;
    executionTime: number;
  }> = [];

  registerModule(moduleName: string, module: HandlerModule) {
    this.modules.set(moduleName, module);
    
    if (module.isActive) {
      this.activateModule(moduleName);
    }
  }

  activateModule(moduleName: string) {
    const module = this.modules.get(moduleName);
    if (!module) return;

    module.isActive = true;
    module.handlers.forEach((config, handlerId) => {
      this.activeHandlers.set(handlerId, config);
    });
  }

  deactivateModule(moduleName: string) {
    const module = this.modules.get(moduleName);
    if (!module) return;

    module.isActive = false;
    module.handlers.forEach((_, handlerId) => {
      this.activeHandlers.delete(handlerId);
    });
  }

  getActiveHandlersByCategory(category: string): HandlerConfig[] {
    return Array.from(this.activeHandlers.values())
      .filter(handler => handler.category === category)
      .sort((a, b) => b.priority - a.priority);
  }

  getHandlersByTag(tag: string): HandlerConfig[] {
    return Array.from(this.activeHandlers.values())
      .filter(handler => handler.tags.includes(tag))
      .sort((a, b) => b.priority - a.priority);
  }

  recordExecution(handlerId: string, success: boolean, executionTime: number) {
    this.executionHistory.push({
      handlerId,
      timestamp: Date.now(),
      success,
      executionTime
    });

    // Keep only last 100 executions
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }
  }

  getExecutionStats(handlerId?: string) {
    const filtered = handlerId 
      ? this.executionHistory.filter(h => h.handlerId === handlerId)
      : this.executionHistory;

    if (filtered.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        recentExecutions: []
      };
    }

    const successCount = filtered.filter(h => h.success).length;
    const averageTime = filtered.reduce((sum, h) => sum + h.executionTime, 0) / filtered.length;

    return {
      totalExecutions: filtered.length,
      successRate: (successCount / filtered.length) * 100,
      averageExecutionTime: averageTime,
      recentExecutions: filtered.slice(-10)
    };
  }

  getModuleOverview() {
    return Array.from(this.modules.entries()).map(([name, module]) => ({
      name,
      description: module.description,
      category: module.category,
      isActive: module.isActive,
      handlerCount: module.handlers.size,
      activeHandlerCount: module.isActive ? module.handlers.size : 0
    }));
  }

  validateDependencies(): string[] {
    const errors: string[] = [];
    
    this.activeHandlers.forEach((handler, handlerId) => {
      if (handler.dependencies) {
        handler.dependencies.forEach(depId => {
          if (!this.activeHandlers.has(depId)) {
            errors.push(`Handler ${handlerId} depends on inactive handler ${depId}`);
          }
        });
      }
    });

    return errors;
  }

  getHandlerMetrics() {
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();
    
    this.activeHandlers.forEach(handler => {
      categories.set(handler.category, (categories.get(handler.category) || 0) + 1);
      handler.tags.forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    });

    return {
      totalActiveHandlers: this.activeHandlers.size,
      totalModules: this.modules.size,
      activeModules: Array.from(this.modules.values()).filter(m => m.isActive).length,
      categoriesDistribution: Object.fromEntries(categories),
      tagsDistribution: Object.fromEntries(tags),
      dependencyErrors: this.validateDependencies()
    };
  }
}

// Singleton instance
export const handlerRegistry = new HandlerRegistry();