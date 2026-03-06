"use client";

import { useState, useRef, useEffect } from "react";
import { getHolidayName } from "@/lib/korean-holidays";

type Props = {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (date: string) => void;
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export function CalendarPicker({ value, onChange }: Props) {
  const today = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() + 1 : today.getMonth() + 1);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day: number) => {
    const mm = String(viewMonth).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  // Build calendar grid cells
  const cells: Array<{ day: number; isSunday: boolean; holiday: string | null; isToday: boolean; isSelected: boolean }> = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: 0, isSunday: false, holiday: null, isToday: false, isSelected: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth - 1, d);
    const dayOfWeek = date.getDay();
    const holiday = getHolidayName(viewYear, viewMonth, d);
    const isToday = viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1 && d === today.getDate();
    const isSelected = parsed ? viewYear === parsed.getFullYear() && viewMonth === parsed.getMonth() + 1 && d === parsed.getDate() : false;
    cells.push({ day: d, isSunday: dayOfWeek === 0, holiday, isToday, isSelected });
  }

  const displayValue = value
    ? `${parsed!.getFullYear()}년 ${parsed!.getMonth() + 1}월 ${parsed!.getDate()}일`
    : "";

  return (
    <div className="cal-wrap" ref={ref}>
      <button type="button" className="cal-trigger" onClick={() => setOpen(!open)}>
        {displayValue || "날짜 선택"}
      </button>

      {open && (
        <div className="cal-dropdown">
          <div className="cal-nav">
            <button type="button" className="cal-nav-btn" onClick={prevMonth}>&lt;</button>
            <span className="cal-nav-title">{viewYear}년 {viewMonth}월</span>
            <button type="button" className="cal-nav-btn" onClick={nextMonth}>&gt;</button>
          </div>

          <div className="cal-grid">
            {DAY_LABELS.map((label, i) => (
              <div key={label} className={`cal-header ${i === 0 ? "cal-sunday" : ""} ${i === 6 ? "cal-saturday" : ""}`}>
                {label}
              </div>
            ))}

            {cells.map((cell, i) => {
              if (cell.day === 0) return <div key={`e${i}`} className="cal-cell cal-empty" />;

              const isRed = cell.isSunday || !!cell.holiday;
              const cls = [
                "cal-cell",
                isRed ? "cal-red" : "",
                cell.isToday ? "cal-today" : "",
                cell.isSelected ? "cal-selected" : ""
              ].filter(Boolean).join(" ");

              return (
                <div
                  key={cell.day}
                  className={cls}
                  title={cell.holiday ?? (cell.isSunday ? "주일" : undefined)}
                  onClick={() => selectDay(cell.day)}
                >
                  <span className="cal-day-num">{cell.day}</span>
                  {cell.holiday && <span className="cal-holiday-dot" />}
                </div>
              );
            })}
          </div>

          {value && (
            <button type="button" className="cal-clear" onClick={() => { onChange(""); setOpen(false); }}>
              날짜 지우기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
