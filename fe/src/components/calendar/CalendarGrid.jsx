import React, { useMemo, useState, useCallback } from 'react';
import CalendarColumn from './CalendarColumn.jsx';
import WeekendSplitColumn from './WeekendSplitColumn.jsx';
import { useData } from '../../context/DataContext.jsx';

const BASE_W = 10; 
const BASE_S = 4;  
const BASE_U = 4;  

export default function CalendarGrid({ days, onOpenDetail }) {

  const { getTasksForDate, compactDay } = useData();

  const [wkSun, setWkSun] = useState(0);
  const [satWk, setSatWk] = useState(0);

  const monToFri = useMemo(() => (days || []).slice(0, 5), [days]);
  const sat = days?.[5];
  const sun = days?.[6];

  const toKey = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.toISOString().slice(0, 10);
  };

  const wKeys = useMemo(() => monToFri.map(toKey), [monToFri]);
  const satKey = useMemo(() => (sat ? toKey(sat) : null), [sat]);
  const sunKey = useMemo(() => (sun ? toKey(sun) : null), [sun]);

  const linesW = BASE_W + wkSun + satWk;
  const linesS = BASE_S + satWk;
  const linesU = BASE_U + wkSun;

  const textAt = (key, idx) => {
    if (!key) return '';
    const list = getTasksForDate(key);
    return list[idx]?.text?.trim() || '';
  };

  const groupAllEmptyAt = useCallback(
    (idx, group) => {
      if (group === 'wkSun') {
        const weekdaysEmpty = wKeys.every(k => textAt(k, idx) === '');
        const sunEmpty = sunKey ? textAt(sunKey, idx) === '' : true;
        return weekdaysEmpty && sunEmpty;
      }
      const satEmpty = satKey ? textAt(satKey, idx) === '' : true;
      const weekdaysEmpty = wKeys.every(k => textAt(k, idx) === '');
      return satEmpty && weekdaysEmpty;
    },
    [wKeys, satKey, sunKey, getTasksForDate]
  );

  const tryTrimLayers = useCallback(() => {
    let changed = true;
    while (changed) {
      changed = false;

      if (wkSun > 0) {
        const idxWkSun = BASE_W + satWk + wkSun - 1;
        if (groupAllEmptyAt(idxWkSun, 'wkSun')) {
          setWkSun(v => v - 1);
          changed = true;
          continue;
        }
      }

      if (wkSun === 0 && satWk > 0) {
        const idxSatWk = BASE_W + satWk - 1;
        if (groupAllEmptyAt(idxSatWk, 'satWk')) {
          setSatWk(v => v - 1);
          changed = true;
          continue;
        }
      }
    }
  }, [wkSun, satWk, groupAllEmptyAt]);

  const growForScope = useCallback(
    (scope, lineIdx, text) => {
      const filled = (text ?? '').trim() !== '';

      if (!filled) {
        tryTrimLayers();
        return;
      }

      if (scope === 'weekday') {
        if (lineIdx === linesW - 1) setWkSun(v => v + 1);
        return;
      }
      if (scope === 'sun') {
        if (lineIdx === linesU - 1) setWkSun(v => v + 1);
        return;
      }
      if (scope === 'sat') {
        if (lineIdx === linesS - 1) setSatWk(v => v + 1);
        return;
      }
    },
    [linesW, linesS, linesU, tryTrimLayers]
  );

  const onAfterEdit = useCallback(
    ({ scope, dateKey, lineIdx, text }) => {
      const trimmedText = (text ?? '').trim();

      growForScope(scope, lineIdx, trimmedText);

      if (trimmedText === '') {
        compactDay(dateKey); 
        tryTrimLayers();    
      }
    },
    [growForScope, tryTrimLayers, compactDay]
  );

  return (
    <div id="main-calendar">
      {monToFri.map((d) => (
        <CalendarColumn
          key={String(d)}
          date={d}
          lines={linesW}
          onAfterEdit={onAfterEdit}
          onOpenDetail={onOpenDetail}
        />
      ))}
      {sat && sun && (
        <WeekendSplitColumn
          satDate={sat}
          sunDate={sun}
          weekdayLines={linesW}
          linesSat={linesS}
          linesSun={linesU}
          onAfterEdit={onAfterEdit}
          onOpenDetail={onOpenDetail}
        />
      )}
    </div>
  );
}
