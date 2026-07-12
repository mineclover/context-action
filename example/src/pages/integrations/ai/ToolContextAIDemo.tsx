/**
 * Tool Context + AI SDK Demo
 *
 * Demonstrates ToolContext integration with OpenRouter and Vercel AI SDK
 * for function calling with UI control tools
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ModelMessage } from 'ai';
import { createToolContext } from '@context-action/react';
import { createBrowserOpenRouterToolRunner } from '../../../lib/openrouter-ai-sdk';
import { uiToolsSchema } from '../../../lib/ui-tools-schema';
import { getFreeModelsWithTools, formatModelName, type OpenRouterModel } from '../../../lib/openrouter-models';
import styles from './ToolContextAIDemo.module.css';

// Create Tool Context
const {
  Provider: UIToolProvider,
  useToolDispatch,
  useToolDispatchWithResult,
  useToolHandler,
  useToolRegistry,
} = createToolContext('UITools', {
  schema: uiToolsSchema,
  debug: true,
});

/**
 * UI State Store
 */
interface UIState {
  theme: 'light' | 'dark';
  heading: string;
  counter: number;
  listItems: Array<{ id: string; text: string; priority: 'low' | 'medium' | 'high' }>;
  notifications: Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>;
}

const initialUIState: UIState = {
  theme: 'light',
  heading: 'AI-Powered UI Control Demo',
  counter: 0,
  listItems: [],
  notifications: [],
};

/**
 * UI State Management Component
 */
function UIStateManager({ children }: { children: React.ReactNode }) {
  const [uiState, setUIState] = useState<UIState>(initialUIState);
  const uiStateRef = useRef(uiState);

  const updateUIState = useCallback((updater: (state: UIState) => UIState) => {
    const nextState = updater(uiStateRef.current);
    uiStateRef.current = nextState;
    setUIState(nextState);
    return nextState;
  }, []);

  // Handle tool calls
  useToolHandler('toggleTheme', useCallback(async (payload) => {
    const nextState = updateUIState(prev => ({
      ...prev,
      theme: payload.theme || (prev.theme === 'light' ? 'dark' : 'light'),
    }));
    return { theme: nextState.theme };
  }, [updateUIState]), { priority: 10, blocking: true });

  useToolHandler('updateHeading', useCallback(async (payload) => {
    const nextState = updateUIState(prev => ({
      ...prev,
      heading: payload.text,
    }));
    return { heading: nextState.heading };
  }, [updateUIState]), { priority: 10, blocking: true });

  useToolHandler('addListItem', useCallback(async (payload) => {
    const nextState = updateUIState(prev => ({
      ...prev,
      listItems: [...prev.listItems, {
        id: Date.now().toString(),
        text: payload.item,
        priority: payload.priority || 'medium',
      }],
    }));
    return { itemCount: nextState.listItems.length };
  }, [updateUIState]), { priority: 10, blocking: true });

  useToolHandler('clearList', useCallback(async (payload) => {
    if (payload.confirm) {
      updateUIState(prev => ({
        ...prev,
        listItems: [],
      }));
    }
    return { cleared: Boolean(payload.confirm) };
  }, [updateUIState]), { priority: 10, blocking: true });

  useToolHandler('showNotification', useCallback(async (payload) => {
    const id = Date.now().toString();
    const notification = {
      id,
      message: payload.message,
      type: payload.type || 'info' as const,
    };
    updateUIState(prev => ({
      ...prev,
      notifications: [...prev.notifications, notification],
    }));

    setTimeout(() => {
      updateUIState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id),
      }));
    }, payload.duration || 3000);
    return { notificationId: id };
  }, [updateUIState]), { priority: 10, blocking: true });

  useToolHandler('updateCounter', useCallback(async (payload) => {
    const nextState = updateUIState(prev => ({
      ...prev,
      counter: prev.counter + payload.amount,
    }));
    return { counter: nextState.counter };
  }, [updateUIState]), { priority: 10, blocking: true });

  useToolHandler('getUiState', useCallback(async (payload) => {
    const fields = payload.fields || ['theme', 'counter', 'listItems', 'heading'];
    const result: Record<string, unknown> = {};
    const currentState = uiStateRef.current;

    for (const field of fields) {
      if (field === 'theme') result.theme = currentState.theme;
      if (field === 'counter') result.counter = currentState.counter;
      if (field === 'listItems') result.listItems = currentState.listItems;
      if (field === 'heading') result.heading = currentState.heading;
    }

    return result;
  }, []), { priority: 10, blocking: true });

  return (
    <div className={styles.container} data-theme={uiState.theme}>
      {React.cloneElement(children as React.ReactElement<{ uiState: UIState }>, { uiState })}
    </div>
  );
}

/**
 * Main Demo UI Component
 */
function DemoUI({ uiState }: { uiState: UIState }) {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [modelMessages, setModelMessages] = useState<ModelMessage[]>([]);
  const [input, setInput] = useState('');
  const [executing, setExecuting] = useState(false);
  const dispatch = useToolDispatch();
  const { dispatchWithResult } = useToolDispatchWithResult();
  const registry = useToolRegistry();
  const toolTextGenerator = useMemo(
    () => apiKey
      ? createBrowserOpenRouterToolRunner({ apiKey, referer: window.location.origin })
      : null,
    [apiKey]
  );

  // Load models on mount
  useEffect(() => {
    setLoading(true);
    getFreeModelsWithTools()
      .then(freeModels => {
        setModels(freeModels);
        if (freeModels.length > 0 && freeModels[0]) {
          setSelectedModel(freeModels[0].id);
        }
      })
      .catch(err => {
        console.error('Failed to load models:', err);
        dispatch('showNotification', {
          message: 'Failed to load OpenRouter models',
          type: 'error',
          duration: 3000,
        });
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey || !selectedModel || executing) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setExecuting(true);

    try {
      const requestMessages: ModelMessage[] = [
        ...modelMessages,
        { role: 'user', content: userMessage },
      ];
      if (!toolTextGenerator) {
        throw new Error('OpenRouter API key is required');
      }

      const response = await toolTextGenerator.generate({
        model: selectedModel,
        messages: requestMessages,
        registry,
        dispatchWithResult,
      });

      const finalContent = response.text || (
        response.toolCallCount > 0
          ? `Completed ${response.toolCallCount} UI tool call(s).`
          : 'Action completed'
      );

      setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
      setModelMessages([...requestMessages, { role: 'assistant', content: finalContent }]);
    } catch (error) {
      console.error('AI request failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      dispatch('showNotification', {
        message: `Error: ${errorMsg}`,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className={styles.demoUI}>
      {/* Settings Panel */}
      <div className={styles.settingsPanel}>
        <h2>Configuration</h2>

        <div className={styles.settingGroup}>
          <label htmlFor="apiKey">OpenRouter API Key</label>
          <input
            id="apiKey"
            type="password"
            placeholder="sk-or-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className={styles.input}
          />
          <small>Your key stays in this browser session and is sent directly to OpenRouter.</small>
        </div>

        <div className={styles.settingGroup}>
          <label htmlFor="model">Model (Free + Tools Support)</label>
          <select
            id="model"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            disabled={loading || models.length === 0}
            className={styles.select}
          >
            <option value="">
              {loading ? 'Loading models...' : 'Select a model'}
            </option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {formatModelName(model)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.contentArea}>
        {/* Header */}
        <div className={styles.header}>
          <h1>{uiState.heading}</h1>
          <div className={styles.stats}>
            <span>Counter: {uiState.counter}</span>
            <span>Theme: {uiState.theme}</span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.twoColumn}>
          {/* Messages (Left) */}
          <div className={styles.messagesSection}>
            <h3>Chat with AI</h3>
            <div className={styles.messagesList}>
              {messages.length === 0 && (
                <div className={styles.emptyMessage}>
                  Start a conversation to control the UI with AI
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
                  <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className={styles.inputForm}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask AI to modify the UI..."
                disabled={!apiKey || !selectedModel || executing}
                className={styles.input}
              />
              <button
                type="submit"
                disabled={!apiKey || !selectedModel || executing || !input.trim()}
                className={styles.button}
              >
                {executing ? 'Processing...' : 'Send'}
              </button>
            </form>
          </div>

          {/* UI State (Right) */}
          <div className={styles.stateSection}>
            <h3>UI State</h3>

            {/* List Items */}
            <div className={styles.statePanel}>
              <h4>List Items ({uiState.listItems.length})</h4>
              {uiState.listItems.length === 0 ? (
                <p className={styles.empty}>No items yet</p>
              ) : (
                <ul className={styles.itemsList}>
                  {uiState.listItems.map((item: { id: string; text: string; priority: string }) => (
                    <li key={item.id} className={styles[`priority-${item.priority}`]}>
                      <span className={styles.badge}>{item.priority}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Notifications */}
            <div className={styles.notificationsArea}>
              {uiState.notifications.map((notif: { id: string; message: string; type: string }) => (
                <div key={notif.id} className={`${styles.notification} ${styles[notif.type]}`}>
                  {notif.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Export - Wrapped with Tool Context
 */
export function ToolContextAIDemo() {
  return (
    <UIToolProvider>
      <UIStateManager>
        <DemoUI uiState={initialUIState} />
      </UIStateManager>
    </UIToolProvider>
  );
}

export default ToolContextAIDemo;
