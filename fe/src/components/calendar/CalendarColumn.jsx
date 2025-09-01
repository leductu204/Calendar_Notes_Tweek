// FE: fe/src/components/calendar/CalendarColumn.jsx
import React, { memo, useMemo, useRef, useCallback } from 'react';
import CalendarLine from './CalendarLine.jsx';
import { formatHeader, isSameDay, toISODate } from '../../utils/dateHelpers.js';
import { useData } from '../../context/DataContext.jsx';

function CalendarColumn({ date, lines = 10, onAfterEdit, onOpenDetail }) {
  const { getTasksForDate } = useData();
  const { day, dateText } = formatHeader(date);
  const dateKey = useMemo(() => toISODate(date), [date]);
  const today = isSameDay(date, new Date());

  const inputRefs = useRef([]);

  const focusTopEmpty = useCallback(() => {
    const firstEmpty = (inputRefs.current || []).find(r => r && r.value.trim() === '');
    (firstEmpty || inputRefs.current?.[0])?.focus();
  }, []);

  const onColumnClick = useCallback((e) => {
    if (!e.target.closest || !e.target.closest('.calendar-task-input')) {
      focusTopEmpty();
    }
  }, [focusTopEmpty]);

  const onRequestFocus = useCallback((currentIdx) => {
    const refs = inputRefs.current || [];
    const emptyIdx = refs.findIndex(r => r && r.value.trim() === '');
    if (emptyIdx !== -1 && emptyIdx < currentIdx) refs[emptyIdx]?.focus();
  }, []);

  const openDetail = useCallback((p) => {
    onOpenDetail?.({ ...p, date, dateKey });
  }, [onOpenDetail, date, dateKey]);

  const tasks = getTasksForDate(dateKey);
  const lineCount = useMemo(() => Math.max(lines, (tasks?.length || 0) + 3), [lines, tasks]);

  return (
    <div className={today ? 'column is-today' : 'column'} onClick={onColumnClick}>
      <div className={`col-head${today ? ' is-today' : ''}`}>
        <div className="col-date">{dateText}</div>
        <div className="col-day">{day}</div>
      </div>
      <div className={today ? 'rule-strong blue' : 'rule-strong'} />

      {Array.from({ length: lineCount }).map((_, i) => {
        const cell = tasks[i];
        return (
          <div className="line" key={`${dateKey}-${i}`}>
            <CalendarLine
              dateKey={dateKey}
              lineIdx={i}
              task={cell}
              onAfterEdit={(p) => onAfterEdit?.({ scope: 'weekday', ...p })}
              inputRef={(el) => (inputRefs.current[i] = el)}
              onRequestFocus={onRequestFocus}
              onOpenDetail={openDetail}
            />
          </div>
        );
      })}
    </div>
  );
}

export default memo(CalendarColumn);
