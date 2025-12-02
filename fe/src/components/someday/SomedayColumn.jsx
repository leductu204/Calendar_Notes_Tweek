// src/components/someday/SomedayColumn.jsx
import React, { useState, useRef, useEffect, memo } from 'react';
import { RepeatIcon, BellIcon, UserPlusIcon } from '../modals/IconSet.jsx';

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const emptyRow = { text: '', hidden: false, done: false, color: '' };

function SomedayColumn({
  column,
  index,
  minRows = 2,
  onUpdate,
  onCommit,            // 👈 NEW: commit khi blur/Enter
  onToggleDone,
  onAddColumn,
  onDeleteColumn,
  onMoveColumn,
  onToggleTaskHidden,
  onToggleCollapse,
  isFirst,
  isLast,
  canDelete,
  onOpenTask
}) {
  const [selectedRow, setSelectedRow] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  const menuRef = useRef(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const outside = (e) => { if (!menuRef.current?.contains(e.target)) setIsMenuOpen(false); };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [isMenuOpen]);

  useEffect(() => {
    if (selectedRow != null) {
      const total = column.collapsed ? 0 : (typeof column.displayRows === 'number' ? column.displayRows : column.tasks.length);
      if (selectedRow >= total) setSelectedRow(null);
    }
  }, [column.displayRows, column.tasks.length, column.collapsed, selectedRow]);

  const isEmptyVisible = (t) => !t?.hidden && ((t?.text ?? '').trim() === '');
  const firstTopEmptyIndex = () => {
    const total = typeof column.displayRows === 'number' ? column.displayRows : column.tasks.length;
    for (let i = 0; i < total; i++) {
      const t = column.tasks[i] || emptyRow;
      if (isEmptyVisible(t)) return i;
    }
    return -1;
  };
  const firstEmptyAbove = (fromIdx) => {
    for (let i = 0; i < fromIdx; i++) {
      const t = column.tasks[i] || emptyRow;
      if (isEmptyVisible(t)) return i;
    }
    return -1;
  };

  const openDetail = (rowIndex) => {
    const task = column.tasks[rowIndex];
    if (!task || !task.text?.trim()) return;
    onOpenTask?.({
      type: 'someday',
      columnId: column.id,
      rowIndex,
      text: task.text,
      done: !!task.done,
      color: task.color || '',
      notes: task.notes || '',
      repeat: task.repeat_info || task.repeat,
      reminder: task.reminder_info || task.reminder,
      share: task.share_info || task.share,
      subtasks: task.subtasks || [],
      attachments: task.attachments || [],
      links: task.links || [],
      extra_notes: task.extra_notes || '',
    });
  };

  const handleSmartChange = (rowIndex, nextText) => {
    const v = nextText ?? '';
    const above = firstEmptyAbove(rowIndex);
    if (above !== -1 && v.trim() !== '') {
      onUpdate(column.id, `task-${above}`, v);
      onUpdate(column.id, `task-${rowIndex}`, '');
      setSelectedRow(above);
      setTimeout(() => inputRefs.current[above]?.focus(), 0);
      return;
    }
    onUpdate(column.id, `task-${rowIndex}`, v);
  };

  const handleMouseDownOnInput = (rowIndex, hasText, e) => {
    if (hasText) return;
    const topEmpty = firstTopEmptyIndex();
    if (topEmpty !== -1 && topEmpty < rowIndex) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedRow(topEmpty);
      setTimeout(() => inputRefs.current[topEmpty]?.focus(), 0);
    } else {
      setSelectedRow(rowIndex);
    }
  };

  const hasAnyVisible = column.tasks.some(
    t => !t.hidden && (t.text ?? '').trim() !== ''
  );

  const rowCount = column.collapsed
    ? 0
    : (typeof column.displayRows === 'number' ? column.displayRows : column.tasks.length);

  return (
    <div className="someday-column">
      <div className="someday-column-header">
        <input
          type="text"
          className="someday-column-title"
          value={column.title}
          onChange={(e) => onUpdate(column.id, 'title', e.target.value)}
          placeholder=" "
        />
        <div className="dropdown" ref={menuRef}>
          <button
            className="someday-column-menu"
            onClick={() => {
              setIsMenuOpen(v => !v);
              if (selectedRow == null) {
                const idx = column.tasks.findIndex(t => !t.hidden && (t.text ?? '').trim() !== '');
                if (idx !== -1) setSelectedRow(idx);
              }
            }}
            aria-expanded={isMenuOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="1.8"></circle>
              <circle cx="12" cy="12" r="1.8"></circle>
              <circle cx="12" cy="18" r="1.8"></circle>
            </svg>
          </button>

          {isMenuOpen && (
            <div className="dropdown-panel">
              {!column.collapsed && hasAnyVisible && (
                <button
                  className="menu-item"
                  onClick={() => { onToggleCollapse(column.id); setIsMenuOpen(false); }}
                >
                  Ẩn cột
                </button>
              )}
              {column.collapsed && (
                <button
                  className="menu-item"
                  onClick={() => { onToggleCollapse(column.id); setIsMenuOpen(false); }}
                >
                  Hiện cột
                </button>
              )}

              {!isLast && (
                <button className="menu-item" onClick={() => { onMoveColumn(column.id, 'right'); setIsMenuOpen(false); }}>
                  Di chuyển sang phải
                </button>
              )}
              {!isFirst && (
                <button className="menu-item" onClick={() => { onMoveColumn(column.id, 'left'); setIsMenuOpen(false); }}>
                  Di chuyển sang trái
                </button>
              )}
              <button className="menu-item" onClick={() => { onAddColumn(index); setIsMenuOpen(false); }}>
                Thêm cột
              </button>
              {canDelete && (
                <button className="menu-item" onClick={() => { onDeleteColumn(column.id); setIsMenuOpen(false); }}>
                  Xóa cột
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <hr className="someday-column-divider" />

      {column.collapsed ? null : (
        <div
          className="someday-rows"
          style={{ display: 'grid', gridTemplateRows: `repeat(${Math.max(rowCount, minRows)}, var(--line-h, 45px))` }}
        >
          {Array.from({ length: Math.max(rowCount, minRows) }).map((_, rowIndex) => {
            const task = column.tasks[rowIndex] || emptyRow;
            if (task.hidden) {
              return (
                <div
                  key={rowIndex}
                  className={`someday-row is-hidden${selectedRow === rowIndex ? ' is-selected' : ''}`}
                  style={{ height: 'var(--line-h,45px)', display: 'flex', alignItems: 'center', padding: '0 8px', opacity: .5 }}
                  onClick={() => setSelectedRow(rowIndex)}
                  title={task.text || 'Đã ẩn'}
                >
                  <span style={{ fontStyle: 'italic' }}>{task.text || '(ẩn)'}</span>
                </div>
              );
            }

            const isSelected = selectedRow === rowIndex;
            const isHovered = hoveredRow === rowIndex;
            const hasText = !!task.text?.trim();
            const hasColor = !!(task.color && task.color.trim() !== '');

            const rowClass =
              `someday-row task-line-row` +
              (task.done ? ' is-done' : '') +
              (hasText ? ' has-text' : '') +
              (hasColor ? ' has-color' : '') +
              (isSelected ? ' is-selected' : '') +
              (isHovered ? ' is-hover' : '');

            const rep = task.repeat_info || task.repeat;
            const rem = task.reminder_info || task.reminder;
            const shr = task.share_info || task.share;

            return (
              <div
                key={rowIndex}
                className={rowClass}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--line)',
                  height: 'var(--line-h,45px)'
                }}
                onMouseEnter={() => setHoveredRow(rowIndex)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => { if (hasText) setSelectedRow(rowIndex); }}
                onDoubleClick={() => { if (hasText) openDetail(rowIndex); }}
              >
                <div className="task-content-wrapper">
                  <input
                    ref={(el) => (inputRefs.current[rowIndex] = el)}
                    type="text"
                    className="someday-task-input calendar-task-input"
                    value={task.text}
                    onChange={(e) => handleSmartChange(rowIndex, e.target.value)}
                    placeholder=""
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      color: hasText && hasColor ? 'transparent' : undefined
                    }}
                    onMouseDown={(e) => handleMouseDownOnInput(rowIndex, hasText, e)}
                    onFocus={() => setSelectedRow(rowIndex)}
                    onBlur={() => onCommit?.(column.id, rowIndex)}   // 👈 COMMIT khi blur/Enter
                  />
                </div>

                {hasText && hasColor && (
                  <div
                    className="task-chip-wrap"
                    onClick={() => openDetail(rowIndex)}
                    style={{ position: 'absolute', left: 8, zIndex: 6 }}
                    title={task.text}
                  >
                    <div className="task-chip colored" style={{ background: task.color }}>
                      <span className="task-chip-text">{task.text}</span>
                    </div>
                  </div>
                )}

                {hasText && (
                  <>
                    <button
                      type="button"
                      className={`complete-btn${task.done ? ' active' : ''}`}
                      aria-label="Hoàn thành"
                      onClick={(ev) => { ev.stopPropagation(); onToggleDone?.(column.id, rowIndex); }}
                      tabIndex={-1}
                    >
                      <CheckIcon />
                    </button>
                    <div className="open-detail-hit" onClick={() => openDetail(rowIndex)} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(SomedayColumn);
