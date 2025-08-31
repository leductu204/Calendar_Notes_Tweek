// src/components/someday/SomedaySection.jsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import SomedayColumn from './SomedayColumn.jsx';
import * as API from '../../api';

const MIN_ROWS = 2;
const MIN_COLUMNS = 3;

const STORAGE_KEY = (scope) => `someday_tasks_v2:${scope}`;
const makeRow = () => ({
  id: null,
  text: '', hidden: false, done: false, color: '', notes: '',
  subtasks: [], attachments: [], modifiedAt: new Date().toISOString(),
});
const initialColumns = [
  { id: 'sc1', title: 'Someday', tasks: Array(MIN_ROWS).fill(0).map(makeRow), collapsed: false },
  { id: 'sc2', title: '',        tasks: Array(MIN_ROWS).fill(0).map(makeRow), collapsed: false },
  { id: 'sc3', title: '',        tasks: Array(MIN_ROWS).fill(0).map(makeRow), collapsed: false },
];
const cloneCols = (cols) => cols.map(c => ({ ...c, tasks: c.tasks.map(t => ({ ...t })) }));

function compactTasks(tasks) {
  const vis = [], hid = [];
  for (const t of tasks) {
    const txt = (t?.text ?? '').trim();
    if (t?.hidden) hid.push({ ...t });
    else if (txt !== '') vis.push({ ...t });
  }
  return [...vis, ...hid];
}
const countVisible = (tasks) => tasks.reduce((n, t) => n + (!t.hidden && (t.text?.trim() ?? '') !== '' ? 1 : 0), 0);
const anyCollapsed = (cols) => cols.some(c => !!c.collapsed);

const loadLocalColumns = (scope) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(scope));
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialColumns;
};
const saveLocalColumns = (scope, cols) => {
  try { localStorage.setItem(STORAGE_KEY(scope), JSON.stringify(cols)); } catch {}
};

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
  cols.map(c => (c.collapsed ? c : ({ ...c, tasks: [...c.tasks, ...Array(count).fill(0).map(makeRow)] })));

export default function SomedaySection({ onOpenTask, registerApi, scope }) {
  // ===== trạng thái đăng nhập & calendarId =====
  const isLoggedIn = scope !== 'guest';
  const hasSomedayApi = !!(API && API.someday && typeof API.someday.board === 'function');
  const memoCalId = useMemo(() => {
    if (!isLoggedIn) return null;
    if (scope?.startsWith?.('cal:')) return scope.slice(4);
    return null;
  }, [scope, isLoggedIn]);

  // Chỉ coi là "dùng server" khi có đủ API & calendar_id
  const wantServer = isLoggedIn && !!memoCalId && hasSomedayApi;

  // =========================== LOCAL ===========================
  const [localColumns, setLocalColumns] = useState(() => loadLocalColumns(scope || 'guest'));
  useEffect(() => { if (!wantServer) setLocalColumns(loadLocalColumns(scope || 'guest')); }, [wantServer, scope]);
  useEffect(() => { if (!wantServer) saveLocalColumns(scope || 'guest', localColumns); }, [wantServer, scope, localColumns]);

  // ========================== SERVER ==========================
  const [serverColumns, setServerColumns] = useState([]);
  const [serverLoaded, setServerLoaded] = useState(false);

  const bootstrapServerBoard = useCallback(async (calId) => {
    try {
      await Promise.all([
        API.someday.createColumn(calId, { title: 'Someday' }),
        API.someday.createColumn(calId, { title: '' }),
        API.someday.createColumn(calId, { title: '' }),
      ]);
    } catch (e) {
      console.error('Bootstrap Someday columns failed:', e);
    }
  }, []);

  const refreshServer = useCallback(async () => {
    if (!wantServer) {
      setServerColumns([]);
      setServerLoaded(false);
      return;
    }
    try {
      setServerLoaded(false);
      let cols = await API.someday.board(memoCalId);
      if (!cols || cols.length === 0) {
        await bootstrapServerBoard(memoCalId);
        cols = await API.someday.board(memoCalId);
      }
      setServerColumns(doLayout(
        (cols || []).map(c => ({
          id: String(c.id),
          title: c.title || '',
          tasks: Array.isArray(c.tasks) ? c.tasks.map(t => ({ ...t })) : [],
          collapsed: false,
        }))
      ));
      setServerLoaded(true);
    } catch (e) {
      console.error('Load Someday board failed:', e);
      setServerColumns([]);
      setServerLoaded(false);
    }
  }, [wantServer, memoCalId, bootstrapServerBoard]);

  useEffect(() => { if (wantServer) refreshServer(); }, [wantServer, memoCalId, scope, refreshServer]);
  useEffect(() => { if (wantServer) setServerColumns([]); }, [wantServer, scope]);

  // ===== hiển thị nguồn nào
  const showServer = wantServer && serverLoaded && serverColumns.length > 0;

  // ======================= API cục bộ (guest) =======================
  const apiForLocal = useMemo(() => ({
    updateSomedayMeta: (columnId, rowIndex, patch) => {
      setLocalColumns(prev => {
        let next = cloneCols(prev);
        const col = next.find(c => c.id === columnId);
        if (!col) return prev;
        if (!col.tasks[rowIndex]) col.tasks[rowIndex] = makeRow();
        const t = col.tasks[rowIndex];

        const textFromPatch = (patch.title ?? patch.text);
        const doneFromPatch = (patch.hasOwnProperty('completed') ? patch.completed : patch.done);
        const colorFromPatch = (patch.hasOwnProperty('color') ? (patch.color || '') : undefined);

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
          const edited = laid.find(c => c.id === columnId);
          const isLast = rowIndex === edited.tasks.length - 1;
          const filled = (col.tasks[rowIndex].text ?? '').trim() !== '';
          if (isLast && filled) laid = addRowAll(laid, 1);
        }
        return laid;
      });
    },
    deleteSomedayTask: (columnId, rowIndex) => {
      setLocalColumns(prev => {
        let next = cloneCols(prev);
        const col = next.find(c => c.id === columnId);
        if (!col) return prev;
        col.tasks.splice(rowIndex, 1);
        next = next.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
        for (const c of next) while (c.tasks.length < MIN_ROWS) c.tasks.push(makeRow());
        return doLayout(next);
      });
    },
    cleanupExpiredTasks: () => {
      setLocalColumns(prev => {
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
    },
    createSomedayTask: (columnKey, rowData, afterIndex) => {
      setLocalColumns(prev => {
        let next = cloneCols(prev);
        const idx =
          typeof columnKey === 'string'
            ? next.findIndex(c => c.id === columnKey)
            : Number.isFinite(columnKey) ? columnKey : -1;
        const col = next[idx >= 0 ? idx : 0];
        const row = {
          id: null,
          text: rowData?.title || rowData?.text || '',
          hidden: false,
          done: !!(rowData?.done ?? rowData?.is_done),
          color: rowData?.color || '',
          notes: rowData?.notes || '',
          subtasks: Array.isArray(rowData?.subtasks) ? rowData.subtasks : [],
          attachments: Array.isArray(rowData?.attachments) ? rowData.attachments : [],
          repeat_info: rowData?.repeat_info || { type: 'never' },
          reminder_info: rowData?.reminder_info || null,
          share_info: rowData?.share_info || { enabled: false },
          links: Array.isArray(rowData?.links) ? rowData.links : [],
          modifiedAt: new Date().toISOString(),
        };

        if (Number.isInteger(afterIndex) && afterIndex >= -1 && afterIndex < col.tasks.length) {
          col.tasks.splice(afterIndex + 1, 0, row);
        } else {
          col.tasks.push(row);
        }

        next = next.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
        return doLayout(next);
      });
    },
    moveSomedayToDate: (columnId, rowIndex, targetDate) => {
      setLocalColumns(prev => {
        const next = cloneCols(prev);
        const cIdx = next.findIndex(c => c.id === columnId);
        if (cIdx === -1) return prev;
        const col = next[cIdx];
        col.tasks.splice(rowIndex, 1);
        return doLayout(next);
      });
    },
  }), []);

  // ======================= API server =======================
  const apiForServer = useMemo(() => ({
    updateSomedayMeta: async (columnId, rowIndex, patch) => {
      if (!memoCalId) return;

      // Cập nhật optimistic ngay (không mất focus vì commit gọi sau blur)
      setServerColumns(prev => {
        const next = cloneCols(prev);
        const col = next.find(c => c.id === columnId);
        if (!col) return prev;
        if (!col.tasks[rowIndex]) col.tasks[rowIndex] = makeRow();
        const t = col.tasks[rowIndex];

        const textFromPatch = (patch.title ?? patch.text);
        const doneFromPatch = (patch.hasOwnProperty('completed') ? patch.completed : patch.done);
        const colorFromPatch = (patch.hasOwnProperty('color') ? (patch.color || '') : undefined);

        col.tasks[rowIndex] = {
          ...t,
          text: textFromPatch !== undefined ? textFromPatch : t.text,
          done: doneFromPatch !== undefined ? !!doneFromPatch : t.done,
          color: colorFromPatch !== undefined ? colorFromPatch : t.color,
          notes: patch.notes !== undefined ? patch.notes : (t.notes || ''),
        };
        return doLayout(next);
      });

      // Lấy snapshot hiện tại để quyết định gọi API
      const colSnap = serverColumns.find(c => c.id === columnId);
      const rowSnap = colSnap?.tasks?.[rowIndex];
      const text = (patch.title ?? patch.text ?? rowSnap?.text ?? '').trim();

      try {
        if (!rowSnap?.id) {
          if (text !== '') {
            await API.someday.createTask(memoCalId, {
              column_id: Number(columnId),
              text,
              notes: patch.notes ?? rowSnap?.notes ?? '',
              is_done: !!(patch.done ?? rowSnap?.done),
              color: patch.color ?? rowSnap?.color ?? '',
              subtasks: rowSnap?.subtasks ?? [],
              attachments: rowSnap?.attachments ?? [],
              repeat_info: rowSnap?.repeat_info ?? { type: 'never' },
              reminder_info: rowSnap?.reminder_info ?? null,
              links: rowSnap?.links ?? [],
            });
            await refreshServer();
          }
        } else {
          // có id thì patch gì cũng được
          await API.someday.updateTask(memoCalId, rowSnap.id, patch);
          await refreshServer();
        }
      } catch (e) {
        console.error('updateSomedayMeta server failed', e);
      }
    },
    deleteSomedayTask: async (columnId, rowIndex) => {
      if (!memoCalId) return;
      const col = serverColumns.find(c => c.id === columnId);
      const row = col?.tasks?.[rowIndex];
      try {
        if (row?.id) await API.someday.deleteTask(memoCalId, row.id);
        await refreshServer();
      } catch (e) {
        console.error('deleteSomedayTask failed', e);
      }
    },
    cleanupExpiredTasks: async () => {},
    createSomedayTask: async (columnKey, rowData, afterIndex) => {
      if (!memoCalId) return;
      const columnId = typeof columnKey === 'string'
        ? columnKey
        : (serverColumns[columnKey]?.id || serverColumns[0]?.id);

      // Optimistic UI
      setServerColumns(prev => {
        const next = cloneCols(prev);
        const col = next.find(c => c.id === String(columnId));
        if (!col) return prev;

        const row = {
          id: null,
          text: rowData?.title || rowData?.text || '',
          hidden: false,
          done: !!(rowData?.done ?? rowData?.is_done),
          color: rowData?.color || '',
          notes: rowData?.notes || '',
          subtasks: Array.isArray(rowData?.subtasks) ? rowData.subtasks : [],
          attachments: Array.isArray(rowData?.attachments) ? rowData.attachments : [],
          repeat_info: rowData?.repeat_info || { type: 'never' },
          reminder_info: rowData?.reminder_info || null,
          share_info: rowData?.share_info || { enabled: false },
          links: Array.isArray(rowData?.links) ? rowData.links : [],
        };

        if (Number.isInteger(afterIndex) && afterIndex >= -1 && afterIndex < col.tasks.length) {
          col.tasks.splice(afterIndex + 1, 0, row);
        } else {
          col.tasks.push(row);
        }
        return doLayout(next);
      });

      try {
        await API.someday.createTask(memoCalId, {
          column_id: Number(columnId),
          text: rowData?.title || rowData?.text || '',
          notes: rowData?.notes || '',
          is_done: !!(rowData?.done ?? rowData?.is_done),
          color: rowData?.color || '',
          subtasks: Array.isArray(rowData?.subtasks) ? rowData.subtasks : [],
          attachments: Array.isArray(rowData?.attachments) ? rowData.attachments : [],
          repeat_info: rowData?.repeat_info || { type: 'never' },
          reminder_info: rowData?.reminder_info || null,
          links: Array.isArray(rowData?.links) ? rowData.links : [],
        });
        await refreshServer();
      } catch (e) {
        console.error('createSomedayTask failed', e);
      }
    },
    moveSomedayToDate: async (columnId, rowIndex, targetDate) => {
      if (!memoCalId) return;
      const col = serverColumns.find(c => c.id === columnId);
      const row = col?.tasks?.[rowIndex];
      if (!row?.id) return;
      const d = new Date(targetDate); d.setHours(12,0,0,0);
      const due = d.toISOString().slice(0,10);
      try {
        await API.someday.moveToDate(memoCalId, row.id, due);
        await refreshServer();
        window.dispatchEvent(new CustomEvent('calendar:maybeRefreshDay', { detail: { dateKey: due } }));
      } catch (e) {
        console.error('moveSomedayToDate failed', e);
      }
    },
  }), [memoCalId, serverColumns, refreshServer]);

  // Đăng ký API đúng với thứ đang hiển thị
  useEffect(() => {
    registerApi?.(showServer ? apiForServer : apiForLocal);
  }, [registerApi, showServer, apiForServer, apiForLocal]);

  // ===== UI bindings =====
  const columns = showServer ? serverColumns : localColumns;
  const setColumns = showServer ? setServerColumns : setLocalColumns;

  // onChange: LOCAL ONLY. (Server sẽ commit ở onCommit)
  const handleUpdate = useCallback((id, field, value) => {
    if (field === 'title') {
      if (!showServer) {
        setColumns(prev => prev.map(c => c.id === id ? { ...c, title: value } : c));
      } else if (memoCalId) {
        // Title commit ngay cũng OK
        API.someday.updateColumn(memoCalId, id, { title: value }).then(() => {
          setServerColumns(prev => prev.map(c => c.id === id ? { ...c, title: value } : c));
        }).catch(console.error);
      }
      return;
    }

    if (!field.startsWith('task-')) return;
    const rowIndex = Number(field.split('-')[1]);

    // ——— Local/Guest: giữ nguyên như cũ
    if (!showServer) {
      apiForLocal.updateSomedayMeta(id, rowIndex, { text: value });
      return;
    }

    // ——— Server: CHỈ cập nhật state cục bộ, KHÔNG gọi API
    setServerColumns(prev => {
      const next = cloneCols(prev);
      const col = next.find(c => c.id === id);
      if (!col) return prev;
      if (!col.tasks[rowIndex]) col.tasks[rowIndex] = makeRow();
      col.tasks[rowIndex].text = value;
      return doLayout(next);
    });
  }, [showServer, setColumns, memoCalId, apiForLocal]);

  // onCommit: gọi API nếu đang ở server (blur/Enter)
  const handleCommit = useCallback((id, rowIndex) => {
    if (!showServer) return;
    const col = serverColumns.find(c => c.id === id);
    const row = col?.tasks?.[rowIndex];
    if (!row) return;

    // sử dụng updateSomedayMeta để nó tự quyết định create/update
    apiForServer.updateSomedayMeta(id, rowIndex, { text: row.text });
  }, [showServer, serverColumns, apiForServer]);

  const onToggleDone = useCallback((columnId, rowIndex) => {
    const col = columns.find(c => c.id === columnId);
    const cur = col?.tasks?.[rowIndex];
    const nextDone = !cur?.done;
    if (!showServer) {
      apiForLocal.updateSomedayMeta(columnId, rowIndex, { done: nextDone });
    } else {
      // done commit ngay
      apiForServer.updateSomedayMeta(columnId, rowIndex, { is_done: nextDone, done: nextDone });
    }
  }, [columns, showServer, apiForLocal, apiForServer]);

  const onToggleTaskHidden = useCallback((columnId, rowIndex) => {
    setColumns(prev => {
      let working = cloneCols(prev);
      const col = working.find(c => c.id === columnId);
      if (!col || !col.tasks[rowIndex]) return prev;
      col.tasks[rowIndex].hidden = !col.tasks[rowIndex].hidden;
      working = working.map(c => ({ ...c, tasks: compactTasks(c.tasks) }));
      return doLayout(working);
    });
  }, [setColumns]);

  const addColumn = useCallback((index) => {
    if (!showServer) {
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
    } else if (memoCalId) {
      API.someday.createColumn(memoCalId, { title: '' })
        .then(() => refreshServer())
        .catch(console.error);
    }
  }, [showServer, setColumns, memoCalId, refreshServer]);

  const deleteColumn = useCallback((id) => {
    if (!showServer) {
      setColumns(prev => (prev.length <= MIN_COLUMNS ? prev : doLayout(prev.filter(c => c.id !== id))));
    } else if (memoCalId) {
      API.someday.deleteColumn(memoCalId, id)
        .then(() => refreshServer())
        .catch(console.error);
    }
  }, [showServer, setColumns, memoCalId, refreshServer]);

  const moveColumn = useCallback((id, direction) => {
    setColumns(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'left'  && idx > 0)               [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      if (direction === 'right' && idx < next.length - 1) [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      return next;
    });
  }, [setColumns]);

  const onToggleCollapse = useCallback((id) => {
    setColumns(prev => doLayout(prev.map(c => c.id === id ? ({ ...c, collapsed: !c.collapsed }) : c)));
  }, [setColumns]);

  return (
    <div className="someday-section">
      <div className="someday-grid">
        {columns.map((column, index) => (
          <SomedayColumn
            key={column.id}
            column={column}
            index={index}
            minRows={MIN_ROWS}
            onUpdate={handleUpdate}
            onCommit={handleCommit}   
            onToggleDone={onToggleDone}
            onAddColumn={addColumn}
            onDeleteColumn={deleteColumn}
            onMoveColumn={moveColumn}
            onToggleTaskHidden={onToggleTaskHidden}
            onToggleCollapse={onToggleCollapse}
            isFirst={index === 0}
            isLast={index === columns.length - 1}
            canDelete={columns.length > MIN_COLUMNS}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>
    </div>
  );
}
