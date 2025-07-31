import { useState } from "react";
import {
	Store,
	useStoreSync,
	createTypedStoreHooks,
	useBatchStoreSync,
	createRegistrySync,
	StoreRegistry,
} from "@context-action/react";

// Create typed hooks for a User type
interface User {
	name: string;
	age: number;
	email: string;
}

const userHooks = createTypedStoreHooks<User>();

// Demo component showing basic useStoreSync
function BasicSyncDemo() {
	const [store] = useState(
		() =>
			new Store<User>("user", {
				name: "John",
				age: 30,
				email: "john@example.com",
			}),
	);

	// Different ways to use useStoreSync
	const snapshot = useStoreSync(store, { selector: (s) => s.value });
	const userName = useStoreSync(store, { selector: (s) => s.value.name });
	const userWithDefault = useStoreSync(store, {
		defaultValue: { name: "Guest", age: 0, email: "" },
	});

	return (
		<div className="sync-demo">
			<h5>Basic useStoreSync</h5>
			<div className="demo-grid">
				<div className="demo-item">
					<strong>Full Snapshot:</strong>
					<pre>{JSON.stringify(snapshot, null, 2)}</pre>
				</div>

				<div className="demo-item">
					<strong>Selected Value (name):</strong>
					<p>{userName}</p>
				</div>

				<div className="demo-item">
					<strong>With Default:</strong>
					<pre>{JSON.stringify(userWithDefault, null, 2)}</pre>
				</div>
			</div>

			<button
				type="button"
				onClick={() => store.update((u) => ({ ...u, age: u.age + 1 }))}
				className="btn btn-primary"
			>
				Increment Age
			</button>
		</div>
	);
}

// Demo component showing typed hooks
function TypedHooksDemo() {
	const [store] = useState(
		() =>
			new Store<User>("typedUser", {
				name: "Alice",
				age: 25,
				email: "alice@example.com",
			}),
	);

	// Use typed hooks
	const user = userHooks.useStoreValue(store);
	const userName = userHooks.useStoreSelector(store, (s) => s.value?.name);
	const [userData, { setValue, update }] = userHooks.useStoreState(store);

	return (
		<div className="sync-demo">
			<h5>Typed Store Hooks</h5>
			<div className="demo-grid">
				<div className="demo-item">
					<strong>User Value:</strong>
					<pre>{JSON.stringify(user, null, 2)}</pre>
				</div>

				<div className="demo-item">
					<strong>Selected Name:</strong>
					<p>{userName}</p>
				</div>

				<div className="demo-item">
					<strong>State-like API:</strong>
					<p>Age: {userData?.age}</p>
				</div>
			</div>

			<div className="demo-controls">
				<button
					onClick={() => update((u) => ({ ...u!, age: u!.age + 1 }))}
					className="btn btn-primary"
				>
					Increment Age
				</button>

				<button
					onClick={() =>
						setValue({ name: "Bob", age: 35, email: "bob@example.com" })
					}
					className="btn btn-secondary"
				>
					Replace User
				</button>
			</div>
		</div>
	);
}

// Demo component showing batch sync
function BatchSyncDemo() {
	const [userStore] = useState(
		() => new Store("batchUser", { name: "Charlie", role: "admin" }),
	);
	const [settingsStore] = useState(
		() => new Store("settings", { theme: "dark", lang: "en" }),
	);
	const [counterStore] = useState(() => new Store("counter", 42));

	const stores = useBatchStoreSync({
		user: userStore,
		settings: settingsStore,
		counter: counterStore,
	});

	return (
		<div className="sync-demo">
			<h5>Batch Store Sync</h5>
			<div className="demo-grid">
				<div className="demo-item">
					<strong>User:</strong>
					<pre>{JSON.stringify(stores.user, null, 2)}</pre>
				</div>

				<div className="demo-item">
					<strong>Settings:</strong>
					<pre>{JSON.stringify(stores.settings, null, 2)}</pre>
				</div>

				<div className="demo-item">
					<strong>Counter:</strong>
					<p>{stores.counter}</p>
				</div>
			</div>

			<div className="demo-controls">
				<button
					onClick={() =>
						settingsStore.update((s) => ({
							...s,
							theme: s.theme === "dark" ? "light" : "dark",
						}))
					}
					className="btn btn-primary"
				>
					Toggle Theme
				</button>

				<button
					onClick={() => counterStore.setValue(stores.counter + 1)}
					className="btn btn-secondary"
				>
					Increment Counter
				</button>
			</div>
		</div>
	);
}

export function StoreSyncPage() {
	return (
		<div className="page-content">
			<h3>Store Sync Utilities</h3>
			<p className="text-gray-600 mb-6">
				Advanced store synchronization with useStoreSync and typed hook
				factories.
			</p>

			<div className="example-section">
				<h4>useStoreSync API</h4>
				<div className="example-card">
					<pre className="code-block">
						{`import { useStoreSync } from '@context-action/react';

// Basic usage - handles null/undefined stores
const snapshot = useStoreSync(store);

// With selector
const userName = useStoreSync(store, {
  selector: s => s.value?.name
});

// With default value
const userWithDefault = useStoreSync(store, {
  defaultValue: { name: 'Guest', age: 0 }
});

// Replaces verbose useSyncExternalStore
const oldWay = useSyncExternalStore(
  store ? store.subscribe : () => () => {},
  store ? () => store.getSnapshot() : () => defaultSnapshot
);`}
					</pre>
				</div>
			</div>

			<div className="example-section">
				<BasicSyncDemo />
			</div>

			<div className="example-section">
				<h4>Typed Store Hooks</h4>
				<div className="example-card">
					<pre className="code-block">
						{`import { createTypedStoreHooks } from '@context-action/react';

// Create type-safe hooks
const userHooks = createTypedStoreHooks<User>();

// Use with full type safety
const user = userHooks.useStoreValue(store);
const name = userHooks.useStoreSelector(store, s => s.value?.name);
const [userData, { setValue, update }] = userHooks.useStoreState(store);`}
					</pre>
				</div>
			</div>

			<div className="example-section">
				<TypedHooksDemo />
			</div>

			<div className="example-section">
				<h4>Batch Store Sync</h4>
				<div className="example-card">
					<pre className="code-block">
						{`import { useBatchStoreSync } from '@context-action/react';

// Subscribe to multiple stores at once
const stores = useBatchStoreSync({
  user: userStore,
  cart: cartStore,
  settings: settingsStore
});

// Access all values with type safety
<p>User: {stores.user?.name}</p>
<p>Cart items: {stores.cart?.items.length}</p>
<p>Theme: {stores.settings?.theme}</p>`}
					</pre>
				</div>
			</div>

			<div className="example-section">
				<BatchSyncDemo />
			</div>

			<div className="example-section">
				<h4>Sync Utilities Benefits</h4>
				<div className="concept-grid">
					<div className="concept-card">
						<h5>🎯 Simplified API</h5>
						<p>
							Replace verbose useSyncExternalStore calls with clean, intuitive
							hooks that handle edge cases.
						</p>
					</div>

					<div className="concept-card">
						<h5>🛡️ Null Safety</h5>
						<p>
							Automatically handles undefined/null stores without runtime
							errors, with proper TypeScript types.
						</p>
					</div>

					<div className="concept-card">
						<h5>🏭 Hook Factories</h5>
						<p>
							Create domain-specific, fully typed hook sets for better developer
							experience and type safety.
						</p>
					</div>

					<div className="concept-card">
						<h5>🚀 Performance</h5>
						<p>
							Optimized selectors and batch operations minimize re-renders and
							improve application performance.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
