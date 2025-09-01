// FE: fe/src/components/modals/useTaskModalHandlers.js
import { confirmRepeatChange, normalizeRepeat } from './RepeatUtils';

/**
 * Hook logic cho Modal Công việc (KHÔNG đổi UI):
 * - Chặn khách: repeat/reminder/share/subtasks không khả dụng khi chưa đăng nhập
 * - Confirm khi đổi repeat
 * - Chuẩn hoá patch gửi ra ngoài qua onPatch (cha sẽ gọi adapter/DataContext để lưu)
 *
 * @param {Object} params
 * @param {Object} params.task        - bản ghi task hiện tại (có thể null khi tạo mới)
 * @param {Function} params.onPatch   - (patchObj) => Promise|void  (cha xử lý lưu)
 * @param {Function} [params.onClose] - đóng modal (optional)
 * @returns handlers & flags
 */
export default function useTaskModalHandlers({ task, onPatch, onClose }) {
  const isLoggedIn = (() => {
    try { return !!localStorage.getItem('token') && !!localStorage.getItem('activeCalendarId'); }
    catch { return false; }
  })();

  function guard(featureName = 'tính năng này') {
    if (!isLoggedIn) {
      alert(`${featureName} chỉ khả dụng sau khi đăng nhập.`);
      return true;
    }
    return false;
  }

  // ====== TEXT / NOTES / COLOR ======
  const setText = async (text) => {
    await onPatch?.({ text: String(text || '') });
  };

  const setNotes = async (notes) => {
    await onPatch?.({ notes: String(notes || '') });
  };

  const setColor = async (color) => {
    await onPatch?.({ color: String(color || '') });
  };

  // ====== DONE ======
  const toggleDone = async () => {
    const next = !task?.is_done && !task?.done;
    await onPatch?.({ is_done: next, done: next });
  };

  // ====== SUBTASKS ======
  const addSubtask = async (title = '') => {
  if (guard('Nhiệm vụ phụ')) return;
  const list = Array.isArray(task?.subtasks) ? [...task.subtasks] : [];
  list.push({ id: `local_${Math.random().toString(36).slice(2)}`, text: String(title || ''), done: false });
  await onPatch?.({ subtasks: list });
 };


  const updateSubtask = async (subId, patch) => {
    if (guard('Nhiệm vụ phụ')) return;
    const list = Array.isArray(task?.subtasks) ? [...task.subtasks] : [];
    const i = list.findIndex(s => String(s.id) === String(subId));
    if (i === -1) return;
    list[i] = { ...list[i], ...(patch || {}) };
    await onPatch?.({ subtasks: list });
  };

  const deleteSubtask = async (subId) => {
    if (guard('Nhiệm vụ phụ')) return;
    const list = Array.isArray(task?.subtasks) ? [...task.subtasks] : [];
    const i = list.findIndex(s => String(s.id) === String(subId));
    if (i === -1) return;
    list.splice(i, 1);
    await onPatch?.({ subtasks: list });
  };

  // ====== REMINDER ======
  const setReminder = async (reminderInfo) => {
    if (guard('Nhắc nhở')) return;
    // reminderInfo ví dụ: { at: '2025-09-10T08:30:00', type:'one-shot' }
    await onPatch?.({ reminder_info: reminderInfo || null });
  };

  // ====== REPEAT ======
  const setRepeat = async (repeatInfo) => {
    if (guard('Lặp lại')) return;
    const prev = task?.repeat_info || task?.repeat || { type: 'never' };
    const next = normalizeRepeat(repeatInfo);
    if (!confirmRepeatChange(prev, next)) return;
    await onPatch?.({ repeat_info: next });
  };

  // ====== SHARE ======
  const enableShare = async () => {
    if (guard('Chia sẻ')) return;
    const info = task?.share_info || { enabled: false };
    if (info.enabled) return; // đã bật
    const next = { ...(info || {}), enabled: true, token: info.token || undefined };
    await onPatch?.({ share_info: next });
  };

  const disableShare = async () => {
    if (guard('Chia sẻ')) return;
    const info = task?.share_info || { enabled: false };
    if (!info.enabled) return;
    const next = { ...(info || {}), enabled: false };
    await onPatch?.({ share_info: next });
  };

  // ====== MOVE (đến ngày / xuống Someday) ======
  const moveToDate = async (dateKeyYYYYMMDD) => {
    // Cha (DataContext) sẽ hiểu patch 'due_date' để chuyển từ someday -> date hoặc đổi ngày
    await onPatch?.({ due_date: dateKeyYYYYMMDD });
    onClose?.();
  };

  const moveToSomedayColumn = async (columnId) => {
    // Cha (DataContext) sẽ hiểu patch 'someday_column_id' để chuyển về Someday
    await onPatch?.({ someday_column_id: Number(columnId) });
    onClose?.();
  };

  // ====== DUPLICATE / DELETE ======
  const duplicate = async () => {
    if (!task?.id) return; // chỉ nhân bản task đã có id
    // Cha nên hỗ trợ duplicate nếu có; ở đây fallback = tạo mới với text
    await onPatch?.({ __duplicate: true }); // gợi ý cho cha, nếu không hỗ trợ thì bỏ qua
  };

  const remove = async () => {
    const ok = window.confirm('Xoá công việc này?');
    if (!ok) return;
    await onPatch?.({ __delete: true }); // gợi ý cho cha thực hiện xoá
    onClose?.();
  };

  return {
    isLoggedIn,

    setText,
    setNotes,
    setColor,
    toggleDone,

    addSubtask,
    updateSubtask,
    deleteSubtask,

    setReminder,
    setRepeat,

    enableShare,
    disableShare,

    moveToDate,
    moveToSomedayColumn,

    duplicate,
    remove,
  };
}
