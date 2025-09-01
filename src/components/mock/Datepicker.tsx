import React, { useMemo, useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./CreateMock.scss";

type DateTimePickerProps = {
  value?: string;
  onChange: (iso: string) => void;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange }) => {
  // Parse incoming value (if present)
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth()); // 0-index
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? value.split(" ")[1]?.slice(0, 5) ?? "" : ""
  );

  // Helpers
  const pad2 = (n: number) => n.toString().padStart(2, "0");

  const daysInMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();

  const firstDayOfMonth = (y: number, m: number) =>
    new Date(y, m, 1).getDay(); // 0=Sun

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth);
    const startOffset = firstDayOfMonth(viewYear, viewMonth); // Sun based
    const cells: Array<{ day: number | null; date?: Date }> = [];

    // Leading blanks
    for (let i = 0; i < startOffset; i++) cells.push({ day: null });

    // Days
    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(viewYear, viewMonth, d);
      cells.push({ day: d, date: dt });
    }

    // Trailing blanks to fill rows of 7
    while (cells.length % 7 !== 0) cells.push({ day: null });
    return cells;
  }, [viewYear, viewMonth]);

  // Generate 30-min time slots (00:00..23:30)
  const timeSlots = useMemo(() => {
    const arr: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        arr.push(`${pad2(h)}:${pad2(m)}`);
      }
    }
    return arr;
  }, []);

  // Month nav
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const handleSelectDate = (dt: Date) => {
    setSelectedDate(dt);
    if (selectedTime) {
      const [hh, mm] = selectedTime.split(":").map(Number);
      const formatted = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(
        dt.getDate()
      )} ${pad2(hh)}:${pad2(mm)}`;
      onChange(formatted);
    }
  };

  const handleSelectTime = (t: string) => {
    setSelectedTime(t);
    if (selectedDate) {
      const [hh, mm] = t.split(":").map(Number);
      const d = selectedDate;
      const formatted = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
        d.getDate()
      )} ${pad2(hh)}:${pad2(mm)}`;
      onChange(formatted);
    }
  };

  // UI helpers
  const isSameDay = (a?: Date | null, b?: Date | null) =>
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const selectedDateOnly = selectedDate
    ? new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      )
    : null;

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="dtp-enhanced">
      {/* Header */}
      <div className="dtp-header-enhanced">
        <button className="btn-nav" type="button" onClick={prevMonth}>
          <ChevronLeft size={18} />
        </button>
        <div className="dtp-title-enhanced">
          {new Date(viewYear, viewMonth, 1).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <button className="btn-nav" type="button" onClick={nextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekdays */}
      <div className="dtp-week-enhanced">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="dtp-weekday-enhanced">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="dtp-grid-enhanced">
        {calendarGrid.map((cell, i) => {
          const isSelected = isSameDay(cell.date || null, selectedDateOnly);
          const isToday = isSameDay(cell.date || null, todayOnly);
          const isPast = cell.date && cell.date < todayOnly;
          
          return (
            <button
              key={i}
              type="button"
              className={`dtp-cell-enhanced ${cell.day ? "" : "is-empty"} ${
                isSelected ? "is-selected" : ""
              } ${isToday && !isSelected ? "is-today" : ""} ${
                isPast ? "is-past" : ""
              }`}
              disabled={!cell.day || isPast}
              onClick={() => cell.date && handleSelectDate(cell.date)}
            >
              {cell.day || ""}
            </button>
          );
        })}
      </div>

      {/* Time list */}
      <div className="dtp-time-enhanced">
        <Clock size={16} />
        <select
          className="dtp-time-select-enhanced"
          value={selectedTime}
          onChange={(e) => handleSelectTime(e.target.value)}
        >
          <option value="">Select time</option>
          {timeSlots.map((t) => {
            // for friendly label
            const [h, m] = t.split(":").map(Number);
            const d = new Date(2024, 0, 1, h, m, 0);
            const label = d.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
            return (
              <option key={t} value={t}>
                {label}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};