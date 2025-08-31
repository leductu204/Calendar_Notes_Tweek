import React, { useMemo, useState } from "react";

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addMonths(d, m) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}
function sameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function DatePickerPopover({ value, onPick, onClose }) {
  const [view, setView] = useState(startOfMonth(value || new Date()));
  const days = useMemo(() => {
    const res = [];
    const firstDow = (view.getDay() + 6) % 7; 
    for (let i = 0; i < firstDow; i++) res.push(null);
    const tmp = new Date(view);
    while (tmp.getMonth() === view.getMonth()) {
      res.push(new Date(tmp));
      tmp.setDate(tmp.getDate() + 1);
    }
    return res;
  }, [view]);

  return (
    <div className="task-pop date-pop" onMouseDown={(e)=>e.stopPropagation()}>
      <div className="cal-head">
        <button className="chev" onClick={() => setView(addMonths(view, -1))}>‹</button>
        <h4 className="title">
          {view.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </h4>
        <button className="chev" onClick={() => setView(addMonths(view, 1))}>›</button>
      </div>

      <div className="cal-grid cal-dow" style={{ marginBottom: 6 }}>
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d)=>(
          <div key={d} className="dow">{d}</div>
        ))}
      </div>

      <div className="cal-grid">
        {days.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            className={"dcell" + (sameDay(d, value) ? " selected" : "")}
            onClick={() => { if (d) onPick?.(d); }}
          >
            {d ? d.getDate() : ""}
          </button>
        ))}
      </div>

      <div className="row end" style={{ marginTop: 10 }}>
        <button className="soft-btn" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
