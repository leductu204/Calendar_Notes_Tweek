// fe/src/components/calendar/WeekendNoteSplitColumn.jsx
import React, { memo, useRef, useCallback, useMemo } from 'react';
import { formatHeader, isSameDay, toISODate } from '../../utils/dateHelpers.js';
import CalendarNoteLine from './CalendarNoteLine.jsx';

function DayMiniColumn({ date, maxLines, inputRefs, onClickHalf }) {
  const { day, dateText } = formatHeader(date);
  const isToday = isSameDay(date, new Date());
  const dateKey = useMemo(() => toISODate(date), [date]);

  const onRequestFocus = useCallback((currentIdx) => {
    const refs = inputRefs.current || [];
    const emptyIdx = refs.findIndex(r => r && r.value.trim() === '');
    if (emptyIdx !== -1 && emptyIdx < currentIdx) refs[emptyIdx]?.focus();
  }, [inputRefs]);

  return (
    <div onClick={(e) => onClickHalf(e, inputRefs)}>
      <div className={`col-head${isToday ? ' is-today' : ''}`}>
        <div className="col-date">{dateText}</div>
        <div className="col-day">{day}</div>
      </div>
      <div className={isToday ? 'rule-strong blue' : 'rule-strong'} />

      {Array.from({ length: maxLines }).map((_, i) => (
        <CalendarNoteLine
          key={`${dateKey}-${i}`}
          date={date}
          lineIdx={i}
          existingNote={null} // Will be loaded by the component itself
          onNoteChange={() => {}} // No need for parent handling in this simplified version
          inputRef={(el) => (inputRefs.current[i] = el)}
          onRequestFocus={onRequestFocus}
        />
      ))}
    </div>
  );
}

function WeekendNoteSplitColumn({ satDate, sunDate, maxLines = 15, hideCompleted }) {
  if (!satDate || !sunDate) return <div className="column weekend-split" />;

  const satRefs = useRef([]);
  const sunRefs = useRef([]);

  const focusTopEmpty = (refs) => {
    const first = (refs.current || []).find((r) => r && r.value.trim() === '');
    (first || refs.current?.[0])?.focus();
  };

  const onClickHalf = useCallback((e, refs) => {
    if (!e.target.classList?.contains('calendar-note-input')) {
      focusTopEmpty(refs);
    }
  }, []);

  // Calculate the split layout similar to original WeekendSplitColumn
  const satLines = Math.floor(maxLines * 0.4); // 40% for Saturday
  const sunLines = Math.floor(maxLines * 0.4); // 40% for Sunday
  const fillers = Math.max(0, maxLines - satLines - sunLines - 2); // Rest as fillers

  const gridStyle = {
    display: 'grid',
    gridTemplateRows: `
      auto 2px repeat(${satLines}, var(--line-h))
      var(--line-h)
      auto 2px repeat(${sunLines}, var(--line-h))
      repeat(${fillers}, var(--line-h))
    `,
    alignContent: 'start',
  };

  return (
    <div className="column weekend-split" style={gridStyle}>
      <DayMiniColumn
        date={satDate}
        maxLines={satLines}
        inputRefs={satRefs}
        onClickHalf={onClickHalf}
      />

      <div className="weekend-spacer-blank" aria-hidden="true" />

      <DayMiniColumn
        date={sunDate}
        maxLines={sunLines}
        inputRefs={sunRefs}
        onClickHalf={onClickHalf}
      />

      {Array.from({ length: fillers }).map((_, i) => (
        <div key={`filler-${i}`} className="weekend-filler" aria-hidden="true" />
      ))}
    </div>
  );
}

export default memo(WeekendNoteSplitColumn);
