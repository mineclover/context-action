/**
 * 독립적인 계산 모듈
 * 순수 함수들로 구성되어 무한루프 방지
 */

import type { TodoItem } from '../types';

// Todo 필터링 계산
export const todoComputations = {
  filterTodos(
    todos: TodoItem[],
    filter: 'all' | 'active' | 'completed'
  ): TodoItem[] {
    if (!todos || todos.length === 0) return [];

    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  },

  sortTodos(
    todos: TodoItem[],
    sortBy: 'created' | 'priority' | 'title'
  ): TodoItem[] {
    if (!todos || todos.length === 0) return [];

    const sorted = [...todos];

    switch (sortBy) {
      case 'priority': {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      }
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  },

  calculateStats(todos: TodoItem[]) {
    if (!todos || todos.length === 0) {
      return { total: 0, completed: 0, active: 0, highPriority: 0 };
    }

    const completed = todos.filter(todo => todo.completed).length;
    const active = todos.length - completed;
    const highPriority = todos.filter(
      todo => todo.priority === 'high' && !todo.completed
    ).length;

    return {
      total: todos.length,
      completed,
      active,
      highPriority
    };
  }
};

// 장바구니 계산
export const cartComputations = {
  calculateTotal(
    cart: Array<{ productId: string; quantity: number }>,
    products: Array<{ id: string; price: number }>
  ): number {
    if (!cart || !products || cart.length === 0 || products.length === 0) {
      return 0;
    }

    return cart.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  },

  calculateItemTotal(
    productId: string,
    quantity: number,
    products: Array<{ id: string; price: number }>
  ): number {
    const product = products?.find(p => p.id === productId);
    return product ? product.price * quantity : 0;
  },

  getTotalItems(cart: Array<{ quantity: number }>): number {
    if (!cart) return 0;
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }
};

// 사용자 프로필 계산
export const profileComputations = {
  calculateCompleteness(user: any): number {
    if (!user) return 0;

    const fields = [
      user.name ? 25 : 0,
      user.email ? 25 : 0,
      user.preferences ? 25 : 0,
      user.lastLogin ? 25 : 0
    ];

    return Math.min(100, fields.reduce((sum, value) => sum + value, 0));
  }
};