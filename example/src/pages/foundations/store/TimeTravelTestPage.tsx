import { createTimeTravelStore, useStoreValue, useTimeTravelControls } from '@context-action/react';
import { useState, useCallback } from 'react';
import { CodeBlock } from '@/components/ui';
import { Button, DemoCard } from '@/components/ui';

// Counter state type
interface CounterState {
  count: number;
  history: string[];
}

// Create TimeTravelStore with undo/redo
const counterStore = createTimeTravelStore<CounterState>(
  'time-travel-counter',
  { count: 0, history: ['Initial state'] },
  { maxHistory: 20 }
);

// Todo state for more complex example
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  nextId: number;
}

const todoStore = createTimeTravelStore<TodoState>(
  'time-travel-todos',
  { todos: [], nextId: 1 },
  { maxHistory: 50 }
);

function CounterDemo() {
  const { count, history } = useStoreValue(counterStore);
  const { canUndo, canRedo, undo, redo, reset, position, historyLength } = useTimeTravelControls(counterStore);

  const increment = useCallback(() => {
    counterStore.setValue({
      count: count + 1,
      history: [...history, `Incremented to ${count + 1}`],
    });
  }, [count, history]);

  const decrement = useCallback(() => {
    counterStore.setValue({
      count: count - 1,
      history: [...history, `Decremented to ${count - 1}`],
    });
  }, [count, history]);

  const multiplyBy2 = useCallback(() => {
    counterStore.setValue({
      count: count * 2,
      history: [...history, `Multiplied to ${count * 2}`],
    });
  }, [count, history]);

  return (
    <DemoCard title="Counter with Undo/Redo">
      <div className="space-y-4">
        {/* Current Value */}
        <div className="text-center">
          <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">
            {count}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Position: {position} / {historyLength - 1}
          </div>
        </div>

        {/* Counter Controls */}
        <div className="flex justify-center gap-2">
          <Button onClick={decrement} variant="secondary">
            - 1
          </Button>
          <Button onClick={increment} variant="primary">
            + 1
          </Button>
          <Button onClick={multiplyBy2} variant="secondary">
            x 2
          </Button>
        </div>

        {/* Undo/Redo Controls */}
        <div className="flex justify-center gap-2 pt-4 border-t">
          <Button
            onClick={() => undo()}
            disabled={!canUndo}
            variant="outline"
          >
            Undo
          </Button>
          <Button
            onClick={() => redo()}
            disabled={!canRedo}
            variant="outline"
          >
            Redo
          </Button>
          <Button
            onClick={() => reset()}
            variant="danger"
          >
            Reset
          </Button>
        </div>

        {/* History Log */}
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-h-32 overflow-y-auto">
          <div className="text-xs font-mono space-y-1">
            {history.slice(-5).map((log, i) => (
              <div key={i} className="text-gray-600 dark:text-gray-400">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoCard>
  );
}

function TodoDemo() {
  const { todos, nextId } = useStoreValue(todoStore);
  const { canUndo, canRedo, undo, redo, reset, position, historyLength } = useTimeTravelControls(todoStore);
  const [newTodoText, setNewTodoText] = useState('');

  const addTodo = useCallback(() => {
    if (!newTodoText.trim()) return;

    todoStore.setValue({
      todos: [...todos, { id: nextId, text: newTodoText, completed: false }],
      nextId: nextId + 1,
    });
    setNewTodoText('');
  }, [todos, nextId, newTodoText]);

  const toggleTodo = useCallback((id: number) => {
    todoStore.setValue({
      todos: todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
      nextId,
    });
  }, [todos, nextId]);

  const deleteTodo = useCallback((id: number) => {
    todoStore.setValue({
      todos: todos.filter((t) => t.id !== id),
      nextId,
    });
  }, [todos, nextId]);

  return (
    <DemoCard title="Todo List with Time Travel">
      <div className="space-y-4">
        {/* Add Todo */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add new todo..."
            className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <Button onClick={addTodo} variant="primary">
            Add
          </Button>
        </div>

        {/* Undo/Redo Controls */}
        <div className="flex gap-2">
          <Button
            onClick={() => undo()}
            disabled={!canUndo}
            variant="outline"
            size="sm"
          >
            Undo
          </Button>
          <Button
            onClick={() => redo()}
            disabled={!canRedo}
            variant="outline"
            size="sm"
          >
            Redo
          </Button>
          <Button
            onClick={() => reset()}
            variant="danger"
            size="sm"
          >
            Reset
          </Button>
          <span className="text-sm text-gray-500 self-center ml-2">
            Position: {position} / {historyLength - 1}
          </span>
        </div>

        {/* Todo List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {todos.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No todos yet. Add one above!
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="w-4 h-4"
                />
                <span
                  className={`flex-1 ${
                    todo.completed ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {todo.text}
                </span>
                <Button
                  onClick={() => deleteTodo(todo.id)}
                  variant="danger"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </DemoCard>
  );
}

function HistoryViewer() {
  const [selectedStore, setSelectedStore] = useState<'counter' | 'todo'>('counter');

  // Subscribe to both stores to trigger re-renders
  const counterControls = useTimeTravelControls(counterStore);
  const todoControls = useTimeTravelControls(todoStore);

  const store = selectedStore === 'counter' ? counterStore : todoStore;
  const controls = selectedStore === 'counter' ? counterControls : todoControls;
  const history = store.getHistory();

  return (
    <DemoCard title="History Viewer">
      <div className="space-y-4">
        {/* Store Selector */}
        <div className="flex gap-2">
          <Button
            onClick={() => setSelectedStore('counter')}
            variant={selectedStore === 'counter' ? 'primary' : 'outline'}
            size="sm"
          >
            Counter
          </Button>
          <Button
            onClick={() => setSelectedStore('todo')}
            variant={selectedStore === 'todo' ? 'primary' : 'outline'}
            size="sm"
          >
            Todo
          </Button>
        </div>

        {/* History Timeline */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {history.map((state, index) => (
            <div
              key={index}
              onClick={() => controls.goTo(index)}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                index === controls.position
                  ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500">
                  #{index}
                </span>
                {index === controls.position && (
                  <span className="text-xs bg-blue-500 text-white px-1 rounded">
                    Current
                  </span>
                )}
              </div>
              <CodeBlock size="xs" className="mt-1 overflow-x-auto">
                {JSON.stringify(state, null, 2).slice(0, 100)}...
              </CodeBlock>
            </div>
          ))}
        </div>
      </div>
    </DemoCard>
  );
}

function TimeTravelTestPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Description */}
        <div className="prose dark:prose-invert max-w-none">
          <h1>TimeTravelStore Demo</h1>
          <p>
            Test the <code>createTimeTravelStore</code> with built-in undo/redo
            functionality powered by <code>@context-action/mutative</code>.
          </p>
        </div>

        {/* Demos Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CounterDemo />
          <TodoDemo />
        </div>

        {/* History Viewer */}
        <HistoryViewer />

        {/* API Reference */}
        <DemoCard title="TimeTravelStore API">
          <div className="prose dark:prose-invert max-w-none text-sm">
            <CodeBlock size="sm">
{`// Create a time travel store
const store = createTimeTravelStore('name', initialValue, {
  maxHistory: 50,  // Maximum undo steps
  mutable: false,  // For observable state (MobX, Vue)
});

// Standard store methods
store.getValue()           // Get current value
store.setValue(value)      // Set value (adds to history)
store.update(fn)           // Update with function

// Time travel methods
store.undo(steps?)         // Undo last change(s)
store.redo(steps?)         // Redo undone change(s)
store.canUndo()            // Check if undo is possible
store.canRedo()            // Check if redo is possible
store.goTo(position)       // Jump to specific history point
store.reset()              // Reset to initial state
store.getHistory()         // Get all history states
store.getPosition()        // Get current position in history`}
            </CodeBlock>
          </div>
        </DemoCard>
      </div>
    </div>
  );
}

export default TimeTravelTestPage;
