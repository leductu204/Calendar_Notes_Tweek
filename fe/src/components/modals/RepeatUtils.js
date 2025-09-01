// FE: fe/src/components/modals/RepeatUtils.js
export function eq(a, b) {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function normalizeRepeat(r) {
  const raw = r?.repeat || r?.repeat_info || r || { type: 'never' };
  const type = raw.type || 'never';

  // Map nhanh các preset mở rộng về cấu trúc chung
  if (type === 'never') return { type: 'never' };
  if (type === 'daily')  return { type: 'daily',  interval: Number(raw.interval || 1) };

  if (type === 'weekdays') {
    // Quy về weekly + byDay Mon–Fri
    return { type: 'weekly', interval: 1, byDay: ['MO','TU','WE','TH','FR'] };
  }

  if (type === 'biweekly') {
    // Quy về weekly + interval=2
    return { type: 'weekly', interval: 2, byDay: Array.isArray(raw.byDay) ? raw.byDay : [] };
  }

  if (type === 'weekly') {
    return {
      type: 'weekly',
      interval: Number(raw.interval || 1),
      byDay: Array.isArray(raw.byDay) ? raw.byDay : [],
    };
  }

  if (type === 'monthly') {
    return {
      type: 'monthly',
      interval: Number(raw.interval || 1),
      byMonthDay: (raw.byMonthDay ?? null),
    };
  }

  if (type === 'yearly') {
    return { type: 'yearly', interval: Number(raw.interval || 1) };
  }

  // custom (giữ thêm unit/end/until nếu có)
  const out = {
    type: 'custom',
    interval: Number(raw.interval || 1),
  };
  if (raw.unit) out.unit = raw.unit;            // day|week|month|year
  if (raw.end)  out.end  = raw.end;             // 'never' | 'on'
  if (raw.until) {
    const d = new Date(raw.until);
    if (!isNaN(d)) out.until = d.toISOString();
  }
  if (Array.isArray(raw.byDay)) out.byDay = raw.byDay.slice();
  if (Number.isInteger(raw.byMonthDay)) out.byMonthDay = raw.byMonthDay;
  if (raw.count != null) out.count = Number(raw.count) || undefined;
  return out;
}

export function fmtRepeat(r) {
  const x = normalizeRepeat(r);
  const joinDays = (arr) => (arr || []).join(', ');

  if (x.type === 'never')  return 'Không lặp';
  if (x.type === 'daily')  return x.interval > 1 ? `Mỗi ${x.interval} ngày` : 'Hàng ngày';
  if (x.type === 'weekly') {
    const base = x.interval > 1 ? `Mỗi ${x.interval} tuần` : 'Hàng tuần';
    const days = joinDays(x.byDay);
    return days ? `${base} (${days})` : base;
  }
  if (x.type === 'monthly') {
    const base = x.interval > 1 ? `Mỗi ${x.interval} tháng` : 'Hàng tháng';
    return Number.isInteger(x.byMonthDay) ? `${base} (ngày ${x.byMonthDay})` : base;
  }
  if (x.type === 'yearly') return x.interval > 1 ? `Mỗi ${x.interval} năm` : 'Hàng năm';

  // custom
  const uMap = { day: 'ngày', week: 'tuần', month: 'tháng', year: 'năm' };
  const core = x.unit ? `Lặp lại mỗi ${x.interval} ${uMap[x.unit] || x.unit}` : 'Lặp tùy chỉnh';
  if (x.end === 'on' && x.until) {
    const d = new Date(x.until);
    if (!isNaN(d)) return `${core} đến ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  }
  return core;
}

export function needsConfirmRepeatChange(prev, next) {
  const a = normalizeRepeat(prev);
  const b = normalizeRepeat(next);
  if (a.type !== b.type) return true;

  // So sánh thêm unit & end để chắc chắn
  const keys = ['interval', 'byDay', 'byMonthDay', 'count', 'until', 'unit', 'end'];
  for (const k of keys) {
    const va = a[k] ?? null;
    const vb = b[k] ?? null;
    if (!eq(va, vb)) return true;
  }
  return false;
}

export function confirmRepeatChange(prev, next) {
  if (!needsConfirmRepeatChange(prev, next)) return true;
  const msg = `Xác nhận thay đổi lặp:\n\n${fmtRepeat(prev)}  →  ${fmtRepeat(next)}\n\nBạn có chắc muốn áp dụng?`;
  return window.confirm(msg);
}
