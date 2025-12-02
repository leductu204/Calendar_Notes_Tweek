// FE: fe/src/components/calendar/CalendarLine.jsx
import React, { memo, useState, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { RepeatIcon } from '../modals/IconSet.jsx';

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getTextColor(bg) {
  if (!bg || bg === 'transparent') return '#111';
  try {
    const c = bg.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? '#111' : '#fff';
  } catch {
    return '#111';
  }
}

function CalendarLine({
  dateKey,
  lineIdx,
  onAfterEdit,
  inputRef,
  onRequestFocus,
  onOpenDetail,
}) {
  const { getTask, updateMeta, toggleDone } = useData();
  const task = getTask(dateKey, lineIdx);

  const isDone = !!(task?.is_done ?? task?.done ?? false);
  const repeatInfo = task?.repeat_info ?? task?.repeat ?? { type: 'never' };

  const [hover, setHover] = useState(false);

  const text = (task?.text || '').trim();
  const hasText = text !== '';
  const hasChip = hasText && !!task?.color;

  const chipStyle = useMemo(() => {
    if (!hasChip) return {};
    const bg = task?.color;
    const color = getTextColor(bg);
    return { background: bg, color, borderColor: 'rgba(0,0,0,.06)' };
  }, [hasChip, task?.color]);

  const onChange = (e) => {
    const next = e.target.value;
    updateMeta(dateKey, lineIdx, { text: next });
    onAfterEdit?.({ dateKey, lineIdx, text: next });
  };

  const openDetail = useCallback(() => {
    if (!hasText) return;
    onOpenDetail?.({ dateKey, lineIdx, date: new Date(dateKey) });
  }, [hasText, onOpenDetail, dateKey, lineIdx]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.currentTarget.value || '').trim() !== '') {
      e.preventDefault();
      e.currentTarget.blur();
      openDetail();
    }
  };

  return (
    <div className="line">
      <div
        className={[
          'task-line-row',
          isDone ? 'is-done' : '',
          hover ? 'is-hover' : '',
          hasText ? 'has-text' : '',
          hasChip ? 'has-chip' : '',
        ].join(' ').trim()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="task-content-wrapper">
          {hasChip ? (
            <div className="task-chip-wrap" style={{ width: '100%' }}>
              <div className="task-chip" style={chipStyle} onClick={openDetail}>
                <div className="task-chip-text">{task.text}</div>
              </div>
            </div>
          ) : (
            <input
              ref={inputRef}
              className="calendar-task-input"
              value={task?.text || ''}
              onChange={onChange}
              onFocus={() => onRequestFocus?.(lineIdx)}
              onKeyDown={onKeyDown}
              onDoubleClick={openDetail}
              placeholder=""
            />
          )}
        </div>

        {hasText && (
          <>
            <button
              type="button"
              className={`complete-btn${isDone ? ' active' : ''}`}
              aria-label="Hoàn thành"
              aria-pressed={isDone}
              onClick={(ev) => {
                ev.stopPropagation();
                toggleDone(dateKey, lineIdx);
              }}
              tabIndex={-1}
              title="Đánh dấu hoàn thành"
            >
              <CheckIcon />
            </button>
            <div className="open-detail-hit" onClick={openDetail} />
          </>
        )}
      </div>
    </div>
  );
}

export default memo(CalendarLine);
