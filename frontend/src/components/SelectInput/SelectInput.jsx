import { Children, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./SelectInput.css";

function SelectInput({ id, value, onChange, options = [], children, placeholder = "Choose an option", disabled = false, required = false }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
	const resolvedOptions = options.length ? options : Children.toArray(children).map((child) => ({ value: child.props.value, label: child.props.children }));
	const selected = resolvedOptions.find((option) => String(option.value) === String(value));

  useEffect(() => {
    const close = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(rect.width, window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < 300 ? Math.max(16, rect.top - 300 - 7) : rect.bottom + 7;
    setMenuStyle({ top, left, width });
  };

  useEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  const select = (nextValue) => {
    onChange({ target: { id, value: nextValue } });
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
    }
    if (event.key === "Escape") setOpen(false);
  };

  return (
    <div className="select-input" ref={rootRef}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={`select-trigger ${selected ? "has-value" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span>{selected?.label || placeholder}</span>
        <svg className={`select-chevron ${open ? "open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && createPortal(
        <div ref={menuRef} className="select-menu" style={menuStyle} role="listbox" aria-labelledby={id}>
							{resolvedOptions.map((option) => (
            <button key={String(option.value)} type="button" role="option" aria-selected={String(option.value) === String(value)} className={`select-option ${String(option.value) === String(value) ? "selected" : ""}`} onClick={() => select(option.value)}>
              <span>{option.label}</span>
              {String(option.value) === String(value) && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

export default SelectInput;
