// fe/src/components/calendar/CalendarNotesGrid.jsx
import React, { useMemo } from 'react';
import CalendarNoteColumn from './CalendarNoteColumn.jsx';
import WeekendNoteSplitColumn from './WeekendNoteSplitColumn.jsx';

export default function CalendarNotesGrid({ days, hideCompleted }) {
  if (!days || days.length === 0) {
    return (
      <div id="main-calendar" style={{ textAlign: 'center', padding: '50px' }}>
        <p style={{ color: '#888' }}>No dates to display</p>
      </div>
    );
  }

  const monToFri = useMemo(() => (days || []).slice(0, 5), [days]);
  const sat = days?.[5];
  const sun = days?.[6];

  const [rowMaxLines, setRowMaxLines] = React.useState(10);

  const handleHeightChange = React.useCallback((needed) => {
    setRowMaxLines(prev => Math.max(prev, needed));
  }, []);

  return (
    <div id="main-calendar">
      {monToFri.map((date) => (
        <CalendarNoteColumn
          key={date.toISOString()}
          date={date}
          maxLines={rowMaxLines}
          onHeightChange={handleHeightChange}
          hideCompleted={hideCompleted}
        />
      ))}
      {sat && sun && (
        <WeekendNoteSplitColumn
          satDate={sat}
          sunDate={sun}
          maxLines={rowMaxLines}
          hideCompleted={hideCompleted}
        />
      )}
    </div>
  );
}
