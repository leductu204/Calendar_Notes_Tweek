// FE: fe/src/components/calendar/WeekendSplitColumn.jsx
import React, { memo, useRef, useCallback, useMemo } from 'react';
import CalendarLine from './CalendarLine.jsx';
import { formatHeader, isSameDay, toISODate } from '../../utils/dateHelpers.js';
import { useData } from '../../context/DataContext.jsx';

function DayMiniColumn({ date, lines, scope, onAfterEdit, inputRefs, onClickHalf, onOpenDetail }) {
  const { getTasksForDate } = useData();             
  const hdr = formatHeader(date);
  const isToday = isSameDay(date, new Date());
  const dateKey = useMemo(() => toISODate(date), [date]);

  const tasks = getTasksForDate(dateKey);          

  const makeReqFocus = (refs) => (currentIdx) => {
    const arr = refs.current || [];
    const i = arr.findIndex((r) => r && r.value.trim() === '');
    if (i !== -1 && i < currentIdx) arr[i]?.focus();
  };

  const openDetail = (p) => {
    onOpenDetail?.({ ...p, date, dateKey });
  };

  return (
    <div onClick={(e) => onClickHalf(e, inputRefs)}>
      <div className={`col-head${isToday ? ' is-today' : ''}`}>
        <div className="col-date">{hdr.dateText}</div>
        <div className="col-day">{hdr.day}</div>
      </div>
      <div className={isToday ? 'rule-strong blue' : 'rule-strong'} />

      {Array.from({ length: lines }).map((_, i) => (
        <div className="line" key={`${dateKey}-${i}`}>
          <CalendarLine
            dateKey={dateKey}
            lineIdx={i}
            task={tasks[i]}                         
            onAfterEdit={(p) => onAfterEdit({ scope, ...p })}
            inputRef={(el) => (inputRefs.current[i] = el)}
            onRequestFocus={makeReqFocus(inputRefs)}
            onOpenDetail={openDetail}
          />
        </div>
      ))}
    </div>
  );
}

function WeekendSplitColumn({ satDate, sunDate, weekdayLines, linesSat, linesSun, onAfterEdit, onOpenDetail }) {
  if (!satDate || !sunDate) return <div className="column weekend-split" />;

  const satRefs = useRef([]);
  const sunRefs = useRef([]);

  const focusTopEmpty = (refs) => {
    const first = (refs.current || []).find((r) => r && r.value.trim() === '');
    (first || refs.current?.[0])?.focus();
  };

  const onClickHalf = useCallback((e, refs) => {
    if (!e.target.classList?.contains('calendar-task-input')) {
      focusTopEmpty(refs);
    }
  }, []);

  const fillers = Math.max(0, (weekdayLines ?? 10) - (linesSat + linesSun + 2));
  const gridStyle = {
    display: 'grid',
    gridTemplateRows: `
      auto 2px repeat(${linesSat}, var(--line-h))
      var(--line-h)
      auto 2px repeat(${linesSun}, var(--line-h))
      repeat(${fillers}, var(--line-h))
    `,
    alignContent: 'start',
  };

  return (
    <div className="column weekend-split" style={gridStyle}>
      <DayMiniColumn
        date={satDate}
        lines={linesSat}
        scope="sat"
        onAfterEdit={onAfterEdit}
        inputRefs={satRefs}
        onClickHalf={onClickHalf}
        onOpenDetail={onOpenDetail}
      />

      <div className="weekend-spacer-blank" aria-hidden="true" />

      <DayMiniColumn
        date={sunDate}
        lines={linesSun}
        scope="sun"
        onAfterEdit={onAfterEdit}
        inputRefs={sunRefs}
        onClickHalf={onClickHalf}
        onOpenDetail={onOpenDetail}
      />

      {Array.from({ length: fillers }).map((_, i) => (
        <div key={`filler-${i}`} className="weekend-filler" aria-hidden="true" />
      ))}
    </div>
  );
}

export default memo(WeekendSplitColumn);
