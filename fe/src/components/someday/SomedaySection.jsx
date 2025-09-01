// FE: fe/src/components/someday/SomedaySection.jsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import SomedayColumn from './SomedayColumn.jsx';
import { useSomeday } from '../../context/SomedayContext.jsx';

const MIN_ROWS = 2;
const MIN_COLUMNS = 3;

const makeRow = () => ({
  id: null,
  text: '', hidden: false, done: false, color: '', notes: '',
  subtasks: [], attachments: [], modifiedAt: new Date().toISOString(),
});

const cloneCols = (cols) => cols.map(c => ({ ...c, tasks: (c.tasks || []).map(t => ({ ...t })) }));

function compactTasks(tasks){
  const vis = [], hid = [];
  for (const t of tasks) {
    const txt = (t?.text ?? '').trim();
    if (t?.hidden) hid.push({ ...t });
    else if (txt !== '') vis.push({ ...t });
  }
  return [...vis, ...hid];
}
const countVisible = (tasks) =>
  tasks.reduce((n,t)=> n + (!t.hidden && (t.text?.trim() ?? '') !== '' ? 1 : 0), 0);
const anyCollapsed = (cols) => cols.some(c => !!c.collapsed);

const layoutEqualized = (prevCols) => {
  let next = cloneCols(prevCols).map(c => ({ ...c, tasks: compactTasks(c.tasks), displayRows: undefined }));
  for (const c of next) while (c.tasks.length < MIN_ROWS) c.tasks.push(makeRow());

  const active = next.filter(c => !c.collapsed);
  const maxLen = Math.max(...active.map(c => c.tasks.length), MIN_ROWS);
  for (const c of active) while (c.tasks.length < maxLen) c.tasks.push(makeRow());

  const lastIdx = Math.max(0, maxLen - 1);
  const lastTaken = active.some(col => {
    const last = col.tasks[lastIdx];
    const txt = last?.text?.trim() ?? '';
    return last?.hidden || txt !== '';
  });
  if (lastTaken) for (const c of active) c.tasks.push(makeRow());

  return next.map(c => (c.collapsed ? { ...c, displayRows: 0 } : c));
};

const layoutIndependent = (prevCols) => {
  let next = cloneCols(prevCols).map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
  const visibles = next.filter(c => !c.collapsed);
  const needs = visibles.map(c => Math.max(MIN_ROWS, countVisible(c.tasks) + 1));
  const maxRows = Math.max(...needs, MIN_ROWS);
  next = next.map(c => {
    if (c.collapsed) return { ...c, displayRows: 0 };
    const tasks = [...c.tasks];
    while (tasks.length < maxRows) tasks.push(makeRow());
    return { ...c, tasks, displayRows: maxRows };
  });
  return next;
};

const doLayout = (prev) => (anyCollapsed(prev) ? layoutIndependent(prev) : layoutEqualized(prev));
const addRowAll = (cols, count = 1) =>
  cols.map(c => c.collapsed ? c : ({ ...c, tasks: [...c.tasks, ...Array(count).fill(0).map(makeRow)] }));

/**
 * Props giữ nguyên chữ ký cũ để không phá UI hiện có:
 * - onOpenTask: (payload) => void
 * - registerApi, scope: không còn cần, nhưng vẫn chấp nhận để tương thích.
 */
export default function SomedaySection({ onOpenTask, registerApi, scope }) {
  // ======= Lấy dữ liệu & API thao tác từ Context (đã adapter guest/server) =======
  const {
    columns: sourceColumns,
    loadBoard,
    createColumn,
    renameColumn,
    deleteColumn,
    createTask,
    updateTask,
    deleteTask,
  } = useSomeday();

  // ======= Local trình bày (order/collapse/layout) — UI only, không đụng DB =======
  const [viewCols, setViewCols] = useState([]);

  // Nạp board khi mount
  useEffect(() => { loadBoard(); }, [loadBoard]);

  // Đồng bộ dữ liệu từ Context vào lớp trình bày, giữ trạng thái collapse đã có
  useEffect(() => {
    setViewCols((prev) => {
      const prevMap = new Map(prev.map(c => [String(c.id), c]));
      const merged = (sourceColumns || []).map(c => {
        const old = prevMap.get(String(c.id));
        return {
          id: String(c.id),
          title: c.title || '',
          tasks: Array.isArray(c.tasks) ? c.tasks.map(t => ({ ...t })) : [],
          collapsed: old?.collapsed || false,
        };
      });
      return doLayout(merged);
    });
  }, [sourceColumns]);

  // ============== Các thao tác UI + gọi API context ==============

  // Gõ chữ trong input từng dòng (chỉ cập nhật trình bày; commit mới gọi API)
  const handleUpdate = useCallback((id, field, value) => {
    if (field === 'title') {
      setViewCols(prev => prev.map(c => c.id === String(id) ? { ...c, title: value } : c));
      // rename cột gọi ngay API (không cần đợi commit)
      renameColumn(String(id), value).catch(console.error);
      return;
    }
    if (!field.startsWith('task-')) return;
    const rowIndex = Number(field.split('-')[1]);

    setViewCols(prev => {
      let next = cloneCols(prev);
      const col = next.find(c => c.id === String(id));
      if (!col) return prev;
      if (!col.tasks[rowIndex]) col.tasks[rowIndex] = makeRow();
      col.tasks[rowIndex] = { ...col.tasks[rowIndex], text: value ?? '' };
      next = next.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
      // nếu không có cột collapsed → auto thêm dòng trống khi hàng cuối được điền
      let laid = doLayout(next);
      if (!anyCollapsed(laid)) {
        const edited = laid.find(c => c.id === String(id));
        const isLast = rowIndex === edited.tasks.length - 1;
        const filled = (col.tasks[rowIndex].text ?? '').trim() !== '';
        if (isLast && filled) laid = addRowAll(laid, 1);
      }
      return laid;
    });
  }, [renameColumn]);

  // Commit khi blur/Enter: tạo mới nếu chưa có id, nếu có id → update
  const handleCommit = useCallback(async (columnId, rowIndex) => {
    try {
      const col = viewCols.find(c => c.id === String(columnId));
      const row = col?.tasks?.[rowIndex];
      const text = (row?.text || '').trim();

      if (!text) {
        // Không commit rỗng
        return;
      }

      if (row?.id) {
        await updateTask(row.id, { text });
      } else {
        await createTask(String(columnId), { text }, rowIndex - 1);
      }
      await loadBoard();
    } catch (e) {
      console.error('Someday commit failed:', e);
    }
  }, [viewCols, updateTask, createTask, loadBoard]);

  const onToggleDone = useCallback(async (columnId, rowIndex) => {
    const col = viewCols.find(c => c.id === String(columnId));
    const row = col?.tasks?.[rowIndex];
    const text = (row?.text || '').trim();
    const nextDone = !row?.done;

    try {
      if (!row?.id) {
        if (!text) return;
        await createTask(String(columnId), { text, is_done: nextDone, done: nextDone }, rowIndex - 1);
      } else {
        await updateTask(row.id, { is_done: nextDone, done: nextDone });
      }
      await loadBoard();
    } catch (e) {
      console.error('toggle done failed:', e);
    }
  }, [viewCols, createTask, updateTask, loadBoard]);

  const onToggleTaskHidden = useCallback((columnId, rowIndex) => {
    setViewCols(prev => {
      let working = cloneCols(prev);
      const col = working.find(c => c.id === String(columnId));
      if (!col || !col.tasks[rowIndex]) return prev;
      col.tasks[rowIndex].hidden = !col.tasks[rowIndex].hidden;
      working = working.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
      return doLayout(working);
    });
  }, []);

  const addColumn = useCallback(async (index) => {
    try {
      await createColumn('');
      await loadBoard();
    } catch (e) {
      console.error('create column failed', e);
    }
  }, [createColumn, loadBoard]);

  const deleteColumnCb = useCallback(async (id) => {
    try {
      if (viewCols.length <= MIN_COLUMNS) return;
      await deleteColumn(String(id));
      await loadBoard();
    } catch (e) {
      console.error('delete column failed', e);
    }
  }, [viewCols.length, deleteColumn, loadBoard]);

  const moveColumn = useCallback((id, direction) => {
    setViewCols(prev => {
      const idx = prev.findIndex(c => c.id === String(id));
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'left'  && idx > 0)               [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      if (direction === 'right' && idx < next.length - 1) [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      return next;
    });
  }, []);

  const onToggleCollapse = useCallback((id) => {
    setViewCols(prev => doLayout(prev.map(c => c.id === String(id) ? ({ ...c, collapsed: !c.collapsed }) : c)));
  }, []);

  // ===== expose API cũ (nếu code ngoài có dùng) — giờ chỉ là no-op/đủ chữ ký
   useEffect(() => {
  if (!registerApi) return;
  registerApi({
    createSomedayTask: async (columnId, row, insertAfterIndex) => {
      const payload = {
        text: row?.text || '',
        notes: row?.notes || '',
        color: row?.color || '',
        subtasks: Array.isArray(row?.subtasks) ? row.subtasks : [],
        attachments: Array.isArray(row?.attachments) ? row.attachments : [],
        repeat_info: row?.repeat_info || { type: 'never' },
        reminder_info: row?.reminder_info || null,
        share_info: row?.share_info || { enabled: false },
        links: Array.isArray(row?.links) ? row.links : [],
        done: !!(row?.done ?? row?.is_done),
        is_done: !!(row?.done ?? row?.is_done),
      };

      // ✅ chọn cột mặc định nếu không truyền vào
      let targetId = columnId != null && columnId !== '' ? String(columnId) : (viewCols[0]?.id || null);
      if (!targetId) {
        await createColumn('');
        await loadBoard();
        targetId = (viewCols[0]?.id) || null;
      }
      if (!targetId) return;

      await createTask(String(targetId), payload,
        Number.isFinite(insertAfterIndex) ? insertAfterIndex : undefined
      );
      await loadBoard();
    },
  });
}, [registerApi, createTask, loadBoard, createColumn, viewCols]);

  


  return (
    <div className="someday-section">
      <div className="someday-grid">
        {viewCols.map((column, index) => (
          <SomedayColumn
            key={column.id}
            column={column}
            index={index}
            minRows={MIN_ROWS}
            onUpdate={handleUpdate}
            onCommit={handleCommit}
            onToggleDone={onToggleDone}
            onAddColumn={addColumn}
            onDeleteColumn={deleteColumnCb}
            onMoveColumn={moveColumn}
            onToggleTaskHidden={onToggleTaskHidden}
            onToggleCollapse={onToggleCollapse}
            isFirst={index === 0}
            isLast={index === viewCols.length - 1}
            canDelete={viewCols.length > MIN_COLUMNS}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>
    </div>
  );
}
