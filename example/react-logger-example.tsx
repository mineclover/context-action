import React, { useState, useCallback } from "react";
import {
	createActionContext,
	LogLevel,
	ConsoleLogger,
} from "../packages/react/src";

// 액션 타입 정의
interface AppActions {
	increment: void;
	setCount: number;
	updateUser: { id: string; name: string };
}

// 1. 기본 사용법 (환경변수나 기본 ERROR 레벨 사용)
const {
	Provider: BasicProvider,
	useAction,
	useActionHandler,
} = createActionContext<AppActions>();

// 2. 로그 레벨 지정
const {
	Provider: DebugProvider,
	useAction: useDebugAction,
	useActionHandler: useDebugActionHandler,
} = createActionContext<AppActions>({
	logLevel: LogLevel.DEBUG,
});

// 3. OTEL 로거 사용
const {
	Provider: OtelProvider,
	useAction: useOtelAction,
	useActionHandler: useOtelActionHandler,
} = createActionContext<AppActions>({
	useOtel: true,
	logLevel: LogLevel.DEBUG,
	otelContext: {
		sessionId: "react-session-123",
		traceId: "react-trace-456",
	},
});

// 4. 커스텀 로거 사용
class CustomReactLogger extends ConsoleLogger {
	info(message: string, ...args: any[]): void {
		if (this.shouldLog(LogLevel.INFO)) {
			console.log(`[CUSTOM REACT] ${message}`, ...args);
		}
	}
}

const customReactLogger = new CustomReactLogger(LogLevel.INFO);
const {
	Provider: CustomProvider,
	useAction: useCustomAction,
	useActionHandler: useCustomActionHandler,
} = createActionContext<AppActions>({
	logger: customReactLogger,
});

// 컴포넌트들
function BasicCounter() {
	const [count, setCount] = useState(0);
	const dispatch = useAction();

	useActionHandler(
		"increment",
		useCallback(() => {
			setCount((prev) => prev + 1);
		}, []),
	);

	useActionHandler(
		"setCount",
		useCallback((newCount: number) => {
			setCount(newCount);
		}, []),
	);

	return (
		<div>
			<h3>Basic Counter (ERROR level)</h3>
			<p>Count: {count}</p>
			<button type="button" onClick={() => dispatch("increment")}>
				Increment
			</button>
			<button type="button" onClick={() => dispatch("setCount", 0)}>
				Reset
			</button>
		</div>
	);
}

function DebugCounter() {
	const [count, setCount] = useState(100);
	const dispatch = useDebugAction();

	useDebugActionHandler(
		"increment",
		useCallback(() => {
			setCount((prev) => prev + 1);
		}, []),
	);

	useDebugActionHandler(
		"setCount",
		useCallback((newCount: number) => {
			setCount(newCount);
		}, []),
	);

	return (
		<div>
			<h3>Debug Counter (DEBUG level)</h3>
			<p>Count: {count}</p>
			<button type="button" onClick={() => dispatch("increment")}>
				Increment
			</button>
			<button type="button" onClick={() => dispatch("setCount", 100)}>
				Reset
			</button>
		</div>
	);
}

function OtelCounter() {
	const [count, setCount] = useState(200);
	const dispatch = useOtelAction();

	useOtelActionHandler(
		"increment",
		useCallback(() => {
			setCount((prev) => prev + 1);
		}, []),
	);

	useOtelActionHandler(
		"setCount",
		useCallback((newCount: number) => {
			setCount(newCount);
		}, []),
	);

	return (
		<div>
			<h3>OTEL Counter (with session/trace)</h3>
			<p>Count: {count}</p>
			<button type="button" onClick={() => dispatch("increment")}>
				Increment
			</button>
			<button type="button" onClick={() => dispatch("setCount", 200)}>
				Reset
			</button>
		</div>
	);
}

function CustomCounter() {
	const [count, setCount] = useState(300);
	const dispatch = useCustomAction();

	useCustomActionHandler(
		"increment",
		useCallback(() => {
			setCount((prev) => prev + 1);
		}, []),
	);

	useCustomActionHandler(
		"setCount",
		useCallback((newCount: number) => {
			setCount(newCount);
		}, []),
	);

	return (
		<div>
			<h3>Custom Counter (custom logger)</h3>
			<p>Count: {count}</p>
			<button type="button" onClick={() => dispatch("increment")}>
				Increment
			</button>
			<button type="button" onClick={() => dispatch("setCount", 300)}>
				Reset
			</button>
		</div>
	);
}

// 메인 앱
function ReactLoggerExample() {
	return (
		<div>
			<h2>React Logger Example</h2>

			<BasicProvider>
				<BasicCounter />
			</BasicProvider>

			<DebugProvider>
				<DebugCounter />
			</DebugProvider>

			<OtelProvider>
				<OtelCounter />
			</OtelProvider>

			<CustomProvider>
				<CustomCounter />
			</CustomProvider>
		</div>
	);
}

export default ReactLoggerExample;
