import "./ConfirmDialog.css";

/* Lightweight confirm modal to replace window.confirm().
   Controlled by the parent: render when `open` is true. */
export default function ConfirmDialog({
	open,
	title = "Are you sure?",
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	tone = "danger", // danger | brand
	onConfirm,
	onCancel,
}) {
	if (!open) return null;
	return (
		<div className="confirm-scrim" onClick={onCancel} role="presentation">
			<div className="confirm-dialog" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-label={title}>
				<h3 className="confirm-title">{title}</h3>
				{message && <p className="confirm-message">{message}</p>}
				<div className="confirm-actions">
					<button className="ht-btn-ghost" onClick={onCancel}>{cancelLabel}</button>
					<button className={tone === "danger" ? "ht-btn-danger" : ""} onClick={onConfirm}>{confirmLabel}</button>
				</div>
			</div>
		</div>
	);
}
