// fe/src/components/someday/SomedaySection.jsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import SomedayColumn from './SomedayColumn.jsx';
import * as API from '../../api';
import { syncSomeday } from '../../api/syncSomeday';

const MIN_ROWS = 2;
const MIN_COLUMNS = 3;
const STORAGE_KEY = (calId) => `someday_tasks_v2:${calId}`;

const makeRow = () => ({
  id: null,
  text: '', hidden: false, done: false, color: '', notes: '',
  subtasks: [], attachments: [], links: [], repeat_info: { type: 'never' },
  reminder_info: null, share_info: { enabled: false },
  modifiedAt: new Date().toISOString(),
});

const initialColumns = [
  { id: 'sc1', title: 'Someday', tasks: Array(MIN_ROWS).fill(0).map(makeRow), collapsed: false },
  { id: 'sc2', title: '',        tasks: Array(MIN_ROWS).fill(0).map(makeRow), collapsed: false },
  { id: 'sc3', title: '',        tasks: Array(MIN_ROWS).fill(0).map(makeRow), collapsed: false },
];

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

const getCalId = () =>
  API?.calendars?.getActiveCalendarId?.() || localStorage.getItem('active_calendar_id') || 'default';

const loadColumns = (calId) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(calId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialColumns;
};
const saveColumns = (calId, cols) => {
  try { localStorage.setItem(STORAGE_KEY(calId), JSON.stringify(cols)); } catch {}
};

// map dữ liệu server -> shape FE
function mapServerBoard(serverCols = []) {
  return serverCols.map(c => ({
    id: String(c.id),
    title: c.title || '',
    collapsed: false,
    tasks: Array.isArray(c.tasks) ? c.tasks.map(t => ({
      id: t.id != null ? String(t.id) : null,
      text: t.text || '',
      hidden: !!t.hidden,
      done: !!(t.done ?? t.is_done),
      color: t.color || '',
      notes: t.notes || '',
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
      attachments: Array.isArray(t.attachments) ? t.attachments : [],
      links: Array.isArray(t.links) ? t.links : [],
      repeat_info: t.repeat_info || { type: 'never' },
      reminder_info: t.reminder_info || null,
      share_info: t.share_info || { enabled: false },
      modifiedAt: new Date().toISOString(),
    })) : [],
  }));
}

export default function SomedaySection({ onOpenTask, registerApi }) {
  const [calId, setCalId] = useState(getCalId());
  const [columns, setColumns] = useState(() => loadColumns(calId));
  const authed = !!API.storage.getToken?.() && !!API.storage.getActiveCalendarId?.();

  // ====== Layout helpers ======
  const layoutEqualized = useCallback((prevCols) => {
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
  }, []);

  const layoutIndependent = useCallback((prevCols) => {
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
  }, []);

  const doLayout = useCallback(
    (prev) => (anyCollapsed(prev) ? layoutIndependent(prev) : layoutEqualized(prev)),
    [layoutIndependent, layoutEqualized]
  );

  const addRowAll = useCallback(
    (cols, count = 1) => cols.map(c => c.collapsed ? c : ({ ...c, tasks: [...c.tasks, ...Array(count).fill(0).map(makeRow)] })),
    []
  );

  // ====== Sync: pull khi login/đổi calendar, nếu guest thì lấy local ======
  const pullBoard = useCallback(async () => {
    const id = getCalId();
    setCalId(id);

    if (syncSomeday.authed()) {
      const cols = await syncSomeday.ensureThreeColumns(id);
      const mapped = doLayout(mapServerBoard(cols));
      setColumns(mapped);
      saveColumns(id, mapped); // cache offline
    } else {
      const local = doLayout(loadColumns(id));
      setColumns(local);
    }
  }, [doLayout]);

  useEffect(() => {
    pullBoard(); // lần đầu
    const onAuth = () => pullBoard();
    const onCal  = () => pullBoard();
    window.addEventListener('authChange', onAuth);
    window.addEventListener('activeCalendarChanged', onCal);
    window.addEventListener('app:activeCalendarChanged', onCal);
    return () => {
      window.removeEventListener('authChange', onAuth);
      window.removeEventListener('activeCalendarChanged', onCal);
      window.removeEventListener('app:activeCalendarChanged', onCal);
    };
  }, [pullBoard]);

  // luôn lưu local
  useEffect(() => { saveColumns(calId, columns); }, [calId, columns]);

  // ===== Expose API cho App (TaskModal) =====
  const createSomedayTask = useCallback(async (columnKey, row, insertAfterIndex) => {
    setColumns(prev => {
      let next = cloneCols(prev);

      // tìm cột theo id hoặc index
      const idx = typeof columnKey === 'string'
        ? next.findIndex(c => c.id === String(columnKey))
        : Number.isFinite(columnKey) ? columnKey : -1;
      const col = next[idx >= 0 ? idx : 0];

      const item = {
        id: row?.id ?? null,
        text: row?.title || row?.text || '',
        hidden: false,
        done: !!(row?.done ?? row?.is_done),
        color: row?.color || '',
        notes: row?.notes || '',
        subtasks: Array.isArray(row?.subtasks) ? row.subtasks : [],
        attachments: Array.isArray(row?.attachments) ? row.attachments : [],
        links: Array.isArray(row?.links) ? row.links : [],
        repeat_info: row?.repeat_info || { type: 'never' },
        reminder_info: row?.reminder_info || null,
        share_info: row?.share_info || { enabled: false },
        modifiedAt: new Date().toISOString(),
      };

      if (Number.isFinite(insertAfterIndex) && insertAfterIndex >= 0 && insertAfterIndex < col.tasks.length) {
        col.tasks.splice(insertAfterIndex + 1, 0, item);
      } else {
        col.tasks.push(item);
      }

      next = next.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
      return doLayout(next);
    });

    // sync server (best-effort)
    if (syncSomeday.authed()) {
      const columnId = (typeof columnKey === 'string')
        ? columnKey
        : (columns[columnKey]?.id || columns[0]?.id);
      const created = await syncSomeday.createTask(calId, String(columnId), {
        text: row?.title || row?.text || '',
        is_done: !!(row?.done ?? row?.is_done),
        color: row?.color || '',
        notes: row?.notes || '',
        subtasks: Array.isArray(row?.subtasks) ? row.subtasks : [],
        attachments: Array.isArray(row?.attachments) ? row.attachments : [],
        links: Array.isArray(row?.links) ? row.links : [],
        repeat_info: row?.repeat_info || { type: 'never' },
        reminder_info: row?.reminder_info || null,
        share_info: row?.share_info || { enabled: false },
      }, insertAfterIndex);
      // optional: pull lại để có id chuẩn
      if (created) pullBoard();
    }
  }, [columns, calId, doLayout, pullBoard]);

  const moveSomedayToDate = useCallback(async (columnId, rowIndex, targetDate) => {
    const date = new Date(targetDate); date.setHours(12,0,0,0);
    const targetKey = date.toISOString().slice(0,10);

    // local: convert to calendar task (Data API local)
    setColumns(prev => {
      const next = cloneCols(prev);
      const c = next.find(x => x.id === String(columnId));
      if (!c || !c.tasks[rowIndex]) return prev;
      const task = c.tasks[rowIndex];
      // ghi sang lịch local (cho offline)
      const existing = API.tasks.getDayTasks(getCalId(), targetKey) || [];
      API.tasks.setDayTasks(getCalId(), targetKey, [...existing, {
        text: task.text, done: !!task.done, color: task.color || '', notes: task.notes || '',
        subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
        attachments: Array.isArray(task.attachments) ? task.attachments : [],
        repeat: task.repeat_info || { type: 'never' },
        reminder: task.reminder_info || null,
        links: Array.isArray(task.links) ? task.links : [],
      }]);

      c.tasks.splice(rowIndex, 1);
      return doLayout(next);
    });

    // server: move or update (nếu có id)
    const row = columns.find(c => String(c.id) === String(columnId))?.tasks?.[rowIndex];
    if (syncSomeday.authed() && row?.id) {
      await syncSomeday.moveToDate(calId, String(row.id), targetKey);
      pullBoard();
    }
  }, [columns, calId, doLayout, pullBoard]);

  const updateSomedayMeta = useCallback(async (columnId, rowIndex, patch) => {
    setColumns(prev => {
      let next = cloneCols(prev);
      const col = next.find(c => String(c.id) === String(columnId));
      if (!col) return prev;

      if (!col.tasks[rowIndex]) col.tasks[rowIndex] = makeRow();
      const t = col.tasks[rowIndex];

      const textFromPatch = (patch.title ?? patch.text);
      const doneFromPatch = (Object.prototype.hasOwnProperty.call(patch, 'completed') ? patch.completed : patch.done);
      const colorFromPatch = (Object.prototype.hasOwnProperty.call(patch, 'color') ? (patch.color || '') : undefined);

      col.tasks[rowIndex] = {
        ...t,
        text: textFromPatch !== undefined ? textFromPatch : t.text,
        done: doneFromPatch !== undefined ? !!doneFromPatch : t.done,
        color: colorFromPatch !== undefined ? colorFromPatch : t.color,
        notes: patch.notes !== undefined ? patch.notes : (t.notes || ''),
        modifiedAt: new Date().toISOString(),
      };

      next = next.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
      let laid = doLayout(next);

      if (!anyCollapsed(laid)) {
        const edited = laid.find(c => String(c.id) === String(columnId));
        const isLast = rowIndex === edited.tasks.length - 1;
        const filled = (col.tasks[rowIndex].text ?? '').trim() !== '';
        if (isLast && filled) laid = addRowAll(laid, 1);
      }
      return laid;
    });

    // sync server
    const row = columns.find(c => String(c.id) === String(columnId))?.tasks?.[rowIndex];
    if (syncSomeday.authed() && row?.id) {
      const patchSrv = {};
      if (patch.title != null || patch.text != null) patchSrv.text = patch.title ?? patch.text ?? '';
      if (patch.notes != null) patchSrv.notes = patch.notes ?? '';
      if (patch.color != null) patchSrv.color = patch.color ?? '';
      if (patch.done != null || patch.completed != null) patchSrv.is_done = !!(patch.done ?? patch.completed);
      await syncSomeday.updateTask(calId, String(row.id), patchSrv);
    }
  }, [columns, calId, doLayout, addRowAll]);

  const deleteSomedayTask = useCallback(async (columnId, rowIndex) => {
    const row = columns.find(c => String(c.id) === String(columnId))?.tasks?.[rowIndex];

    setColumns(prev => {
      let next = cloneCols(prev);
      const col = next.find(c => String(c.id) === String(columnId));
      if (!col) return prev;
      col.tasks.splice(rowIndex, 1);
      next = next.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
      for (const c of next) while (c.tasks.length < MIN_ROWS) c.tasks.push(makeRow());
      return doLayout(next);
    });

    if (syncSomeday.authed() && row?.id) {
      await syncSomeday.deleteTask(calId, String(row.id));
      pullBoard();
    }
  }, [columns, calId, doLayout, pullBoard]);

  const cleanupExpiredTasks = useCallback(() => {
    setColumns(prev => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7*24*3600*1000).getTime();
      const next = cloneCols(prev);
      next.forEach(col => {
        col.tasks = col.tasks.filter(task => {
          const isEmpty = (task.text || '').trim() === '';
          if (isEmpty) return true;
          const modifiedDate = new Date(task.modifiedAt || 0);
          return modifiedDate.getTime() > sevenDaysAgo;
        });
      });
      return doLayout(next);
    });
  }, [doLayout]);

  // expose API cho App
  useEffect(() => {
    registerApi?.({
      updateSomedayMeta,
      deleteSomedayTask,
      cleanupExpiredTasks,
      createSomedayTask,
      moveSomedayToDate
    });
  }, [registerApi, updateSomedayMeta, deleteSomedayTask, cleanupExpiredTasks, createSomedayTask, moveSomedayToDate]);

  // ===== UI Handlers (title, add/delete/move column, toggle done/hidden) =====
  const handleUpdate = useCallback((id, field, value) => {
    if (field === 'title') {
      setColumns(prev => prev.map(c => String(c.id) === String(id) ? { ...c, title: value } : c));
      // sync tên cột
      if (syncSomeday.authed()) syncSomeday.renameColumn(calId, String(id), String(value || ''));
      return;
    }
    if (!field.startsWith('task-')) return;

    const rowIndex = Number(field.split('-')[1]);

    setColumns(prev => {
      let working = cloneCols(prev);
      const col = working.find(c => String(c.id) === String(id));
      if (!col) return prev;
      if (!col.tasks[rowIndex]) col.tasks[rowIndex] = makeRow();
      col.tasks[rowIndex].text = value ?? '';
      col.tasks[rowIndex].modifiedAt = new Date().toISOString();

      working = working.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
      let laid = doLayout(working);

      if (!anyCollapsed(laid)) {
        const edited = laid.find(c => String(c.id) === String(id));
        const isLast = rowIndex === edited.tasks.length - 1;
        const filled = (value ?? '').trim() !== '';
        if (isLast && filled) laid = addRowAll(laid, 1);
      }
      return laid;
    });
  }, [doLayout, addRowAll, calId]);

  const onToggleDone = useCallback((columnId, rowIndex) => {
    setColumns(prev => {
      const working = cloneCols(prev);
      const col = working.find(c => String(c.id) === String(columnId));
      if (!col || !col.tasks[rowIndex]) return prev;
      col.tasks[rowIndex].done = !col.tasks[rowIndex].done;
      col.tasks[rowIndex].modifiedAt = new Date().toISOString();
      return doLayout(working);
    });

    // sync server nếu có id
    const row = columns.find(c => String(c.id) === String(columnId))?.tasks?.[rowIndex];
    if (syncSomeday.authed() && row?.id) {
      syncSomeday.updateTask(calId, String(row.id), { is_done: !row.done }).then(() => pullBoard());
    }
  }, [columns, calId, doLayout, pullBoard]);

  const onToggleTaskHidden = useCallback((columnId, rowIndex) => {
    setColumns(prev => {
      let working = cloneCols(prev);
      const col = working.find(c => String(c.id) === String(columnId));
      if (!col || !col.tasks[rowIndex]) return prev;
      col.tasks[rowIndex].hidden = !col.tasks[rowIndex].hidden;
      col.tasks[rowIndex].modifiedAt = new Date().toISOString();
      working = working.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
      return doLayout(working);
    });
  }, [doLayout]);

  const addColumn = useCallback(async (index) => {
    // nếu login: tạo cột trên server trước để lấy id thật
    if (syncSomeday.authed()) {
      const created = await syncSomeday.createColumn(calId, '');
      await pullBoard();
      return;
    }

    // guest: thêm local
    setColumns(prev => {
      const rowCount = Math.max(
        MIN_ROWS,
        prev.filter(c => !c.collapsed).reduce((m, c) => Math.max(m, (c.displayRows || c.tasks.length)), 0)
      );
      const newColumn = {
        id: `sc_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        title: '',
        tasks: Array(rowCount).fill(0).map(makeRow),
        collapsed: false,
      };
      const next = [...prev];
      next.splice(index + 1, 0, newColumn);
      return doLayout(next);
    });
  }, [doLayout, calId, pullBoard]);

  const deleteColumnCb = useCallback(async (id) => {
    setColumns(prev => (prev.length <= MIN_COLUMNS ? prev : doLayout(prev.filter(c => String(c.id) !== String(id)))));
    if (syncSomeday.authed()) await syncSomeday.deleteColumn(calId, String(id));
  }, [doLayout, calId]);

  const moveColumn = useCallback((id, direction) => {
    setColumns(prev => {
      const idx = prev.findIndex(c => String(c.id) === String(id));
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'left'  && idx > 0)               [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      if (direction === 'right' && idx < next.length - 1) [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      return next;
    });
    // (tuỳ BE có API reorder thì gọi thêm)
  }, []);

  const onToggleCollapse = useCallback((id) => {
    setColumns(prev => doLayout(prev.map(c => String(c.id) === String(id) ? ({ ...c, collapsed: !c.collapsed }) : c)));
  }, [doLayout]);

  // ===== Render =====
  const rowsLayout = useMemo(() => columns, [columns]);

  return (
    <div className="someday-section">
      <div className="someday-grid">
        {rowsLayout.map((column, index) => (
          <SomedayColumn
            key={column.id}
            column={column}
            index={index}
            minRows={MIN_ROWS}
            onUpdate={handleUpdate}
            onToggleDone={onToggleDone}
            onAddColumn={addColumn}
            onDeleteColumn={deleteColumnCb}
            onMoveColumn={moveColumn}
            onToggleTaskHidden={onToggleTaskHidden}
            onToggleCollapse={onToggleCollapse}
            isFirst={index === 0}
            isLast={index === rowsLayout.length - 1}
            canDelete={rowsLayout.length > MIN_COLUMNS}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>
    </div>
  );
}
