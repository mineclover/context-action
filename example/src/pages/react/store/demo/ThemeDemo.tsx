/**
 * Theme switcher component demonstrating theme store usage
 */

import type React from "react";
import { useState } from "react";
import { Store, useStoreRegistry, useStoreValue } from "@context-action/react";

interface ThemeConfig {
	theme: "light" | "dark";
	primaryColor: string;
	fontSize: "small" | "medium" | "large";
	animations: boolean;
}

class ThemeStore extends Store<ThemeConfig> {
	constructor(name: string) {
		super(name, {
			theme: "light",
			primaryColor: "#3b82f6",
			fontSize: "medium",
			animations: true,
		});
	}

	setTheme(theme: ThemeConfig["theme"]) {
		this.update((config) => ({ ...config, theme }));
	}

	setPrimaryColor(primaryColor: string) {
		this.update((config) => ({ ...config, primaryColor }));
	}

	setFontSize(fontSize: ThemeConfig["fontSize"]) {
		this.update((config) => ({ ...config, fontSize }));
	}

	toggleAnimations() {
		this.update((config) => ({ ...config, animations: !config.animations }));
	}
}

const ThemeDemo: React.FC = () => {
	const registry = useStoreRegistry();

	// Get or create the theme store
	const [themeStore] = useState(() => {
		let store = registry.getStore("theme") as ThemeStore;
		if (!store) {
			store = new ThemeStore("theme");
			registry.register("theme", store);
		}
		return store;
	});

	const themeValue = useStoreValue(themeStore);

	if (themeStore == null || themeValue == null) {
		return (
			<div style={cardStyle}>
				<h3>🎨 Theme Demo</h3>
				<p>Theme store loading...</p>
			</div>
		);
	}

	const isDark = themeValue.theme === "dark";
	const currentStyle = {
		...cardStyle,
		backgroundColor: isDark ? "#1f2937" : "white",
		color: isDark ? "#f9fafb" : "#1e293b",
		border: `1px solid ${isDark ? "#374151" : "#e2e8f0"}`,
	};

	return (
		<div style={currentStyle}>
			<h3 style={{ ...titleStyle, color: isDark ? "#f9fafb" : "#1e293b" }}>
				🎨 Theme Demo
			</h3>
			<p style={{ ...descriptionStyle, color: isDark ? "#d1d5db" : "#64748b" }}>
				Demonstrates theme management with real-time preview updates.
			</p>

			<div
				style={{
					...previewStyle,
					backgroundColor: isDark ? "#374151" : "#f8fafc",
					border: `2px solid ${themeValue.primaryColor}`,
					color: isDark ? "#f9fafb" : "#1e293b",
				}}
			>
				<div
					style={{
						fontSize:
							themeValue.fontSize === "small"
								? "0.8rem"
								: themeValue.fontSize === "large"
									? "1.2rem"
									: "1rem",
					}}
				>
					Current theme: <strong>{themeValue.theme}</strong>
				</div>
				<div
					style={{
						marginTop: "8px",
						padding: "8px 12px",
						backgroundColor: themeValue.primaryColor,
						color: "white",
						borderRadius: "6px",
						fontSize:
							themeValue.fontSize === "small"
								? "0.75rem"
								: themeValue.fontSize === "large"
									? "1.1rem"
									: "0.9rem",
					}}
				>
					Primary Color Preview
				</div>
			</div>

			<div style={sectionStyle}>
				<h4
					style={{
						...sectionTitleStyle,
						color: isDark ? "#f3f4f6" : "#374151",
					}}
				>
					Theme Mode
				</h4>
				<div style={buttonGroupStyle}>
					{(["light", "dark"] as const).map((theme) => (
						<button
							type="button"
							key={theme}
							style={{
								...buttonStyle,
								backgroundColor:
									themeValue.theme === theme
										? themeValue.primaryColor
										: isDark
											? "#4b5563"
											: "#f3f4f6",
								color:
									themeValue.theme === theme
										? "white"
										: isDark
											? "#f9fafb"
											: "#374151",
							}}
							onClick={() => themeStore.setTheme(theme)}
						>
							{theme.charAt(0).toUpperCase() + theme.slice(1)}
						</button>
					))}
				</div>
				<button
					type="button"
					style={{
						...buttonStyle,
						backgroundColor: "#f59e0b",
						color: "white",
						marginTop: "8px",
					}}
					onClick={() =>
						themeStore.setTheme(themeValue.theme === "dark" ? "light" : "dark")
					}
				>
					Toggle Light/Dark
				</button>
			</div>

			<div style={sectionStyle}>
				<h4
					style={{
						...sectionTitleStyle,
						color: isDark ? "#f3f4f6" : "#374151",
					}}
				>
					Primary Color
				</h4>
				<div style={colorGridStyle}>
					{[
						{ name: "Blue", value: "#3b82f6" },
						{ name: "Green", value: "#10b981" },
						{ name: "Purple", value: "#8b5cf6" },
						{ name: "Red", value: "#ef4444" },
						{ name: "Orange", value: "#f59e0b" },
						{ name: "Pink", value: "#ec4899" },
					].map((color) => (
						<button
							type="button"
							key={color.value}
							style={{
								...colorButtonStyle,
								backgroundColor: color.value,
								border:
									themeValue.primaryColor === color.value
										? "3px solid #1f2937"
										: "2px solid transparent",
							}}
							onClick={() => themeStore.setPrimaryColor(color.value)}
							title={color.name}
						/>
					))}
				</div>
				<div style={presetButtonsStyle}>
					{[
						{
							name: "Blue",
							theme: "light" as const,
							primaryColor: "#3b82f6",
							fontSize: "medium" as const,
						},
						{
							name: "Green",
							theme: "light" as const,
							primaryColor: "#10b981",
							fontSize: "medium" as const,
						},
						{
							name: "Purple",
							theme: "dark" as const,
							primaryColor: "#8b5cf6",
							fontSize: "large" as const,
						},
						{
							name: "Red",
							theme: "light" as const,
							primaryColor: "#ef4444",
							fontSize: "small" as const,
						},
					].map((preset) => (
						<button
							type="button"
							key={preset.name}
							style={{
								...buttonStyle,
								backgroundColor: isDark ? "#4b5563" : "#f3f4f6",
								color: isDark ? "#f9fafb" : "#374151",
								fontSize: "0.8rem",
							}}
							onClick={() => {
								themeStore.setTheme(preset.theme);
								themeStore.setPrimaryColor(preset.primaryColor);
								themeStore.setFontSize(preset.fontSize);
							}}
						>
							{preset.name}
						</button>
					))}
				</div>
			</div>

			<div style={sectionStyle}>
				<h4
					style={{
						...sectionTitleStyle,
						color: isDark ? "#f3f4f6" : "#374151",
					}}
				>
					Font Size
				</h4>
				<div style={buttonGroupStyle}>
					{(["small", "medium", "large"] as const).map((size) => (
						<button
							type="button"
							key={size}
							style={{
								...buttonStyle,
								backgroundColor:
									themeValue.fontSize === size
										? themeValue.primaryColor
										: isDark
											? "#4b5563"
											: "#f3f4f6",
								color:
									themeValue.fontSize === size
										? "white"
										: isDark
											? "#f9fafb"
											: "#374151",
							}}
							onClick={() => themeStore.setFontSize(size)}
						>
							{size.charAt(0).toUpperCase() + size.slice(1)}
						</button>
					))}
				</div>
			</div>

			<div style={infoStyle}>
				<small style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
					Theme changes are applied in real-time. This component demonstrates
					conditional styling based on store state.
				</small>
			</div>
		</div>
	);
};

// Styles
const cardStyle: React.CSSProperties = {
	backgroundColor: "white",
	borderRadius: "12px",
	padding: "24px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
	border: "1px solid #e2e8f0",
	transition: "all 0.3s ease",
};

const titleStyle: React.CSSProperties = {
	margin: "0 0 8px 0",
	fontSize: "1.25rem",
	fontWeight: "600",
};

const descriptionStyle: React.CSSProperties = {
	margin: "0 0 20px 0",
	fontSize: "0.9rem",
	lineHeight: "1.4",
};

const previewStyle: React.CSSProperties = {
	padding: "16px",
	borderRadius: "8px",
	marginBottom: "20px",
	textAlign: "center",
	transition: "all 0.3s ease",
};

const sectionStyle: React.CSSProperties = {
	marginBottom: "20px",
};

const sectionTitleStyle: React.CSSProperties = {
	margin: "0 0 12px 0",
	fontSize: "1rem",
	fontWeight: "500",
};

const buttonGroupStyle: React.CSSProperties = {
	display: "flex",
	gap: "8px",
	flexWrap: "wrap",
};

const buttonStyle: React.CSSProperties = {
	padding: "8px 16px",
	border: "none",
	borderRadius: "6px",
	cursor: "pointer",
	fontSize: "0.85rem",
	fontWeight: "500",
	transition: "all 0.2s",
};

const colorGridStyle: React.CSSProperties = {
	display: "grid",
	gridTemplateColumns: "repeat(6, 1fr)",
	gap: "8px",
	marginBottom: "12px",
};

const colorButtonStyle: React.CSSProperties = {
	width: "40px",
	height: "40px",
	borderRadius: "8px",
	cursor: "pointer",
	transition: "all 0.2s",
	position: "relative",
};

const presetButtonsStyle: React.CSSProperties = {
	display: "flex",
	gap: "6px",
	marginTop: "8px",
};

const infoStyle: React.CSSProperties = {
	marginTop: "16px",
	padding: "12px",
	backgroundColor: "rgba(59, 130, 246, 0.1)",
	borderRadius: "6px",
	borderLeft: "3px solid #3b82f6",
};

export default ThemeDemo;
