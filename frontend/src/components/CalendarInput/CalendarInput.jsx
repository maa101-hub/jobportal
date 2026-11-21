import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./CalendarInput.css";

const pad = (value) => String(value).padStart(2, "0");
const toDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
    ? new Date(year, month - 1, day)
    : null;
};
const toValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateLabel = (value, placeholder) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : placeholder;
};

function CalendarInput({ id, value, onChange, placeholder = "Choose a date" }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const selectedDate = toDate(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
  const [popoverStyle, setPopoverStyle] = useState({});

  const updatePopoverPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(310, window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < 360 ? Math.max(16, rect.top - 360 - 9) : rect.bottom + 9;
    setPopoverStyle({ top, left, width });
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target) && !popoverRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [open]);

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const days = useMemo(() => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  }, [viewDate]);

  const chooseDate = (day) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(toValue(next));
    setOpen(false);
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    onChange(toValue(today));
    setOpen(false);
  };

  const shiftMonth = (offset) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <div className="calendar-input" ref={rootRef}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={`calendar-trigger ${value ? "has-value" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{dateLabel(value, placeholder)}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M8 2.8v3.4M16 2.8v3.4M3 9h18" />
        </svg>
      </button>

      {open && createPortal(
        <div ref={popoverRef} className="calendar-popover" style={popoverStyle} role="dialog" aria-label="Choose date">
          <div className="calendar-header">
            <button type="button" className="calendar-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <strong>{monthLabel}</strong>
            <button type="button" className="calendar-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid">
            {days.map((day, index) => {
              const dayValue = day ? toValue(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) : "";
              const isSelected = dayValue === value;
              const isToday = dayValue === toValue(new Date());
              return day ? (
                <button key={dayValue} type="button" className={`calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`} onClick={() => chooseDate(day)} aria-label={dayValue} aria-pressed={isSelected}>{day}</button>
              ) : <span key={`blank-${index}`} className="calendar-day blank" aria-hidden="true" />;
            })}
          </div>

          <div className="calendar-footer">
            <button type="button" className="calendar-clear" onClick={() => { onChange(""); setOpen(false); }}>Clear</button>
            <button type="button" className="calendar-today" onClick={goToToday}>Today</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default CalendarInput;
