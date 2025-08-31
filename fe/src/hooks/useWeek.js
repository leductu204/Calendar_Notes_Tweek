//src/hooks/useWeek.js
import { useMemo, useState, useCallback } from "react";

function startOfWeekMonday(d) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  const dow = x.getDay();           
  const diff = (dow === 0 ? -6 : 1 - dow); 
  x.setDate(x.getDate() + diff);
  return x;
}

function makeWeekDays(base) {
  const mon = startOfWeekMonday(base);
  const arr = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    arr.push(d);
  }
  return arr;
}


export function useWeek(initialDate = new Date()) {
  const [viewDate, setViewDate] = useState(() => {
    const x = new Date(initialDate);
    x.setHours(12, 0, 0, 0);
    return x;
  });

  const days = useMemo(() => makeWeekDays(viewDate), [viewDate]);

  const prevWeek = useCallback(() => {
    const x = new Date(viewDate);
    x.setDate(x.getDate() - 7);
    setViewDate(x);
  }, [viewDate]);

  const nextWeek = useCallback(() => {
    const x = new Date(viewDate);
    x.setDate(x.getDate() + 7);
    setViewDate(x);
  }, [viewDate]);

  const gotoDate = useCallback((d) => {
    if (!d) return;
    const x = new Date(d);
    x.setHours(12, 0, 0, 0);
    setViewDate(x);
  }, []);

  return { days, prevWeek, nextWeek, gotoDate };
}

export default useWeek;
