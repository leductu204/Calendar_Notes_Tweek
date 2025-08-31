const MS_DAY = 86400000;
const mid = (d) => { const x = new Date(d); x.setHours(12,0,0,0); return x; };
const ymd = (d) => mid(d).toISOString().slice(0,10);
const sameYMD = (a,b) => ymd(a) === ymd(b);

export function occursOn(baseDate, targetDate, rule) {
  if (!rule || rule.type === 'never') return false;
  const b = mid(baseDate), t = mid(targetDate);
  if (t < b) return false;

  const dayDiff = Math.round((t - b) / MS_DAY);
  const sameDow = t.getDay() === b.getDay();
  const sameDom = t.getDate() === b.getDate();
  const sameMD = t.getDate() === b.getDate() && t.getMonth() === b.getMonth();

  const until = rule.until ? mid(rule.until) : null;
  if (until && t > until) return false;

  switch (rule.type) {
    case 'daily': return true;
    case 'weekly': return sameDow;
    case 'weekdays': return t.getDay() >= 1 && t.getDay() <= 5;
    case 'biweekly': return sameDow && (dayDiff % 14 === 0);
    case 'monthly': return sameDom;
    case 'yearly': return sameMD;
    case 'custom': {
      const every = Math.max(1, parseInt(rule.interval || rule.every || 1, 10));
      const unit = rule.unit || 'day';
      if (Array.isArray(rule.byWeekdays) && rule.byWeekdays.length) {
        if (!rule.byWeekdays.includes(t.getDay())) return false;
      }
      if (unit === 'day') return dayDiff % every === 0;
      if (unit === 'week') return dayDiff % (7 * every) === 0;
      if (unit === 'month') {
        const months = (t.getFullYear()-b.getFullYear())*12 + (t.getMonth()-b.getMonth());
        return sameDom && (months % every === 0);
      }
      if (unit === 'year') {
        const years = t.getFullYear() - b.getFullYear();
        return sameMD && (years % every === 0);
      }
      return false;
    }
    default: return false;
  }
}

export function expandOccurrences(master, windowStart, windowEnd) {
  const base  = mid(master.dateStart);
  const start = mid(windowStart), end = mid(windowEnd);

  const rule  = master.repeat_info || master.repeat || { type: 'never' };

  if (end < base && (!rule || rule.type === 'never')) {
    return [];
  }

  const out = [];
  const ex = new Set((master.exdates || []).map(ymd));
  const until = rule?.until ? mid(rule.until) : null;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const k = ymd(d);
    const isBase = sameYMD(d, base);
    const repeats = rule && rule.type !== 'never'
      ? occursOn(base, d, rule)
      : false;

    if (!isBase && !repeats) continue;
    if (ex.has(k)) continue;
    if (until && d > until) continue;

    const override = (master.overrides && master.overrides[k]) || null;

    out.push({
      masterId: master.id,
      dateKey: k,
      isMasterBase: isBase,
      data: {
        ...master,
        ...override,
        text: (override?.text ?? master.text) || '',
        dateStart: new Date(k),
        repeat_info: rule,
      }
    });
  }
  return out;
}
