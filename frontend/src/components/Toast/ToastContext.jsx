import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import "./Toast.css";

const ToastContext = createContext(null);

let idSeq = 0;

const ICONS = {
	success: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
	),
	error: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
	),
	info: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8h.01M11 12h1v4h1" /><circle cx="12" cy="12" r="9" /></svg>
	),
	warning: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
	),
};

export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);
	const timers = useRef({});

	// Two-phase dismiss: flag as exiting so it can animate out symmetrically,
	// then remove after the exit duration (matches --dur-2 = 240ms).
	const dismiss = useCallback((id) => {
		if (timers.current[id]) {
			clearTimeout(timers.current[id]);
			delete timers.current[id];
		}
		setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 240);
	}, []);

	const push = useCallback(
		(type, message, opts = {}) => {
			const id = ++idSeq;
			const duration = opts.duration ?? (type === "error" ? 5000 : 3200);
			setToasts((prev) => [...prev, { id, type, message }]);
			timers.current[id] = setTimeout(() => dismiss(id), duration);
			return id;
		},
		[dismiss]
	);

	const api = useMemo(
		() => ({
			toast: (message, opts) => push("info", message, opts),
			success: (message, opts) => push("success", message, opts),
			error: (message, opts) => push("error", message, opts),
			info: (message, opts) => push("info", message, opts),
			warning: (message, opts) => push("warning", message, opts),
			dismiss,
		}),
		[push, dismiss]
	);

	return (
		<ToastContext.Provider value={api}>
			{children}
			<div className="toaster" role="region" aria-live="polite" aria-label="Notifications">
				{toasts.map((t) => (
					<div key={t.id} className={`toast toast-${t.type}${t.exiting ? " toast-exit" : ""}`} role="status">
						<span className="toast-icon" aria-hidden="true">{ICONS[t.type] || ICONS.info}</span>
						<span className="toast-msg">{t.message}</span>
						<button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

// Safe hook — returns a no-throw shim if used outside a provider, so pages
// never crash even if the tree isn't wrapped yet.
export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		const noop = () => {};
		return { toast: noop, success: noop, error: noop, info: noop, warning: noop, dismiss: noop };
	}
	return ctx;
}
