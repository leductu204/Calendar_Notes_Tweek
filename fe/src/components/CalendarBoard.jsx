import React, { useEffect, useRef, useState } from "react";

const iso = (d) => new Date(d).toISOString().slice(0,10);
const todayISO = () => iso(new Date());


const loadTasks = () => {
  try { return JSON.parse(localStorage.getItem("calendar.tasksByDate") || "{}"); }
  catch { return {}; }
};
const saveTasks = (obj) => {
  localStorage.setItem("calendar.tasksByDate", JSON.stringify(obj));
};

const loadSettings = () => {
  try {
    return JSON.parse(localStorage.getItem("calendar.settings") || "{}");
  } catch { return {}; }
};

function carryOverUncompletedToToday(tasksByDate, nowISO = todayISO()) {
  const next = { ...tasksByDate };
  const toDay = nowISO;
  next[toDay] = Array.isArray(next[toDay]) ? [...next[toDay]] : [];

  Object.keys(next).forEach((d) => {
    if (d >= toDay) return;
    const arr = Array.isArray(next[d]) ? next[d] : [];
    const remain = [];
    for (const t of arr) {
      if (t && !t.done) {
        next[toDay].push({ ...t, date: toDay });
      } else {
        remain.push(t);
      }
    }
    next[d] = remain;
  });

  return next;
}

function sortCompletedInAllDays(tasksByDate) {
  const next = {};
  for (const d of Object.keys(tasksByDate)) {
    const arr = Array.isArray(tasksByDate[d]) ? tasksByDate[d] : [];
    const undone = [];
    const done = [];
    for (const t of arr) (t?.done ? done : undone).push(t);
    next[d] = [...undone, ...done];
  }
  return next;
}

function applySettingsToDom(st) {
  const root = document.documentElement;
  if (st.hideCompleted) root.classList.add("cal-hide-done");
  else root.classList.remove("cal-hide-done");
}

export default function CalendarBoard() {
  const [tasksByDate, setTasksByDate] = useState(loadTasks);
  const settingsRef = useRef({
    publishLink:false, moveUncompletedToday:false, sortCompleted:false, hideCompleted:false
  });

  useEffect(() => {
    const st = { publishLink:false, moveUncompletedToday:false, sortCompleted:false, hideCompleted:false, ...loadSettings() };
    settingsRef.current = st;
    applySettingsToDom(st);

    if (st.moveUncompletedToday) {
      setTasksByDate((prev) => {
        const next = carryOverUncompletedToToday(prev, todayISO());
        const finalObj = st.sortCompleted ? sortCompletedInAllDays(next) : next;
        saveTasks(finalObj);
        return finalObj;
      });
    }
  }, []);

  useEffect(() => {
    const onSettings = (e) => {
      const st = e.detail || {};
      settingsRef.current = { ...settingsRef.current, ...st };
      applySettingsToDom(settingsRef.current);

      if (st.moveUncompletedToday) {
        setTasksByDate((prev) => {
          const next = carryOverUncompletedToToday(prev, todayISO());
          const finalObj = settingsRef.current.sortCompleted ? sortCompletedInAllDays(next) : next;
          saveTasks(finalObj);
          return finalObj;
        });
      }
      if (st.sortCompleted) {
        setTasksByDate((prev) => {
          const next = sortCompletedInAllDays(prev);
          saveTasks(next);
          return next;
        });
      }
    };
    window.addEventListener("calendar:settings", onSettings);
    return () => window.removeEventListener("calendar:settings", onSettings);
  }, []);

  const updateTasks = (producer) => {
    setTasksByDate((prev) => {
      const rawNext = typeof producer === "function" ? producer(prev) : producer;
      const sortedNext = settingsRef.current.sortCompleted ? sortCompletedInAllDays(rawNext) : rawNext;
      saveTasks(sortedNext);
      return sortedNext;
    });
  };

  useEffect(() => {
    const msToMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 3);
      return next.getTime() - now.getTime();
    };
    let timer = setTimeout(function tick() {
      if (settingsRef.current.moveUncompletedToday) {
        setTasksByDate((prev) => {
          const next = carryOverUncompletedToToday(prev, todayISO());
          const finalObj = settingsRef.current.sortCompleted ? sortCompletedInAllDays(next) : next;
          saveTasks(finalObj);
          return finalObj;
        });
      }
      timer = setTimeout(tick, msToMidnight());
    }, msToMidnight());
    return () => clearTimeout(timer);
  }, []);

  const addTask = (dateISO, text) => {
    updateTasks((prev) => {
      const day = prev[dateISO] || [];
      const t = { id: Date.now() + Math.random(), text, done: false, date: dateISO };
      return { ...prev, [dateISO]: [...day, t] };
    });
  };

  const toggleDone = (dateISO, id) => {
    updateTasks((prev) => {
      const day = prev[dateISO] || [];
      const nextDay = day.map(t => t.id === id ? { ...t, done: !t.done } : t);
      return { ...prev, [dateISO]: nextDay };
    });
  };

  return (
    <div>
   
      <pre style={{ whiteSpace:'pre-wrap' }}>{JSON.stringify(tasksByDate, null, 2)}</pre>
      <button onClick={() => addTask(todayISO(), "Việc demo")}>+ Add today</button>
    </div>
  );
}
