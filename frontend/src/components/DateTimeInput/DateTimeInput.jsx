import { useEffect, useState } from "react";
import CalendarInput from "../CalendarInput/CalendarInput";
import SelectInput from "../SelectInput/SelectInput";
import "./DateTimeInput.css";

function DateTimeInput({ id, value = "", onChange, required = false, disabled = false }) {
	const [date = "", time = ""] = value.split("T");
	const [draftDate, setDraftDate] = useState(date);
	const [draftTime, setDraftTime] = useState(time);
	const [timeParts, setTimeParts] = useState({ hour: "", minute: "", period: "" });

	useEffect(() => {
		setDraftDate(date);
		setDraftTime(time);
		if (time) {
			const [hour = "00", minute = "00"] = time.split(":");
			const parsed = Number(hour);
			setTimeParts({ hour: String(parsed % 12 || 12).padStart(2, "0"), minute, period: parsed >= 12 ? "PM" : "AM" });
		} else {
			setTimeParts({ hour: "", minute: "", period: "" });
		}
	}, [date, time]);

	const hourOptions = Array.from({ length: 12 }, (_, index) => {
		const hour = String(index + 1).padStart(2, "0");
		return { value: hour, label: hour };
	});
	const minuteOptions = Array.from({ length: 60 }, (_, index) => {
		const minute = String(index).padStart(2, "0");
		return { value: minute, label: minute };
	});
	const periodOptions = ["AM", "PM"].map((item) => ({ value: item, label: item }));

	const update = (nextDate = draftDate, nextTime = draftTime) => {
		setDraftDate(nextDate);
		setDraftTime(nextTime);
		onChange?.({ target: { value: nextDate ? `${nextDate}${nextTime ? `T${nextTime}` : ""}` : "" } });
	};

	const updateTime = (nextHour = timeParts.hour, nextMinute = timeParts.minute, nextPeriod = timeParts.period) => {
		const nextParts = { hour: nextHour, minute: nextMinute, period: nextPeriod };
		setTimeParts(nextParts);
		if (!nextHour || !nextMinute || !nextPeriod) return;
		let hour = Number(nextHour) % 12;
		if (nextPeriod === "PM") hour += 12;
		update(draftDate, `${String(hour).padStart(2, "0")}:${nextMinute}`);
	};

	return (
		<div className="ht-datetime" id={id}>
			<CalendarInput
				id={`${id}-date`}
				value={draftDate}
				onChange={(nextDate) => update(nextDate, draftTime)}
				disabled={disabled}
				placeholder="Choose date"
			/>
			<div className="ht-time-picker" aria-label="Choose time">
				<SelectInput id={`${id}-hour`} value={timeParts.hour} onChange={(event) => updateTime(event.target.value)} options={hourOptions} placeholder="HH" disabled={disabled} required={required} />
				<span className="ht-time-separator" aria-hidden="true">:</span>
				<SelectInput id={`${id}-minute`} value={timeParts.minute} onChange={(event) => updateTime(timeParts.hour, event.target.value)} options={minuteOptions} placeholder="MM" disabled={disabled} required={required} />
				<SelectInput id={`${id}-period`} value={timeParts.period} onChange={(event) => updateTime(timeParts.hour, timeParts.minute, event.target.value)} options={periodOptions} placeholder="AM/PM" disabled={disabled} />
			</div>
		</div>
	);
}

export default DateTimeInput;
