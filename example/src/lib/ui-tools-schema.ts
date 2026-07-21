/**
 * UI Control Tools Schema
 *
 * Defines tools for controlling UI elements via ToolContext
 * These tools can be called by AI models to interact with the UI
 */

import {
  createActionSchema,
  defineAction,
} from '@context-action/tool-protocol';
import { z } from 'zod';

/**
 * Toggle theme between light and dark
 */
export const toggleThemeTool = defineAction(
  {
    name: 'toggleTheme',
    description: 'Toggle the UI theme between light and dark mode',
    annotations: { idempotentHint: true },
    parameters: z.object({
      theme: z
        .enum(['light', 'dark'])
        .optional()
        .describe('Target theme (if not provided, toggles current)'),
    }),
  },
  z
);

/**
 * Update the main heading text
 */
export const updateHeadingTool = defineAction(
  {
    name: 'updateHeading',
    description: 'Update the main heading text on the page',
    annotations: { idempotentHint: true },
    parameters: z.object({
      text: z.string().min(1).max(100).describe('New heading text'),
    }),
  },
  z
);

/**
 * Add an item to the display list
 */
export const addListItemTool = defineAction(
  {
    name: 'addListItem',
    description: 'Add an item to the display list',
    parameters: z.object({
      item: z.string().min(1).max(100).describe('Item text to add'),
      priority: z
        .enum(['low', 'medium', 'high'])
        .optional()
        .default('medium')
        .describe('Priority level of the item'),
    }),
  },
  z
);

/**
 * Clear all items from the display list
 */
export const clearListTool = defineAction(
  {
    name: 'clearList',
    description: 'Clear all items from the display list',
    annotations: { destructiveHint: true },
    parameters: z.object({
      confirm: z
        .boolean()
        .optional()
        .default(true)
        .describe('Confirm clearing the list'),
    }),
  },
  z
);

/**
 * Show a notification to the user
 */
export const showNotificationTool = defineAction(
  {
    name: 'showNotification',
    description: 'Show a notification message to the user',
    parameters: z.object({
      message: z.string().min(1).max(200).describe('Notification message'),
      type: z
        .enum(['info', 'success', 'warning', 'error'])
        .optional()
        .default('info')
        .describe('Notification type'),
      duration: z
        .number()
        .optional()
        .default(3000)
        .describe('Duration in milliseconds'),
    }),
  },
  z
);

/**
 * Update the counter value
 */
export const updateCounterTool = defineAction(
  {
    name: 'updateCounter',
    description: 'Update the counter value by a given amount',
    parameters: z.object({
      amount: z.number().describe('Amount to increase/decrease the counter'),
    }),
  },
  z
);

/**
 * Get current UI state
 */
export const getUiStateTool = defineAction(
  {
    name: 'getUiState',
    description:
      'Get the current state of the UI (theme, counter, list items, etc)',
    annotations: { readOnlyHint: true },
    parameters: z.object({
      fields: z
        .array(z.enum(['theme', 'counter', 'listItems', 'heading']))
        .optional()
        .describe('Specific fields to retrieve (if not provided, returns all)'),
    }),
  },
  z
);

/**
 * Create the complete UI Tools schema
 */
export const uiToolsSchema = createActionSchema({
  toggleTheme: toggleThemeTool,
  updateHeading: updateHeadingTool,
  addListItem: addListItemTool,
  clearList: clearListTool,
  showNotification: showNotificationTool,
  updateCounter: updateCounterTool,
  getUiState: getUiStateTool,
});

/**
 * Type for UI Tools actions
 */
export type UIToolsActions = typeof uiToolsSchema;
