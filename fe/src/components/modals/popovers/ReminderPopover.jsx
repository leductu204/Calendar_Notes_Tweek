// src/components/popovers/ReminderPopover.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmtViFullDate = (d) =>
  `${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;

function ArrowBtn({ dir = "right", onClick, size = 30, title }) {
  const deg = { right: 0, left: 180, up: -90, down: 90 }[dir] ?? 0;
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: 0,
        background: "transparent",
        borderRadius: 999,
        fontSize: Math.round(size * 0.70),
        fontWeight: 500,
        lineHeight: 1,
        transform: `rotate(${deg}deg)`,
        cursor: "pointer",
        userSelect: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {">"}
    </button>
  );
}
export default function ReminderPopover({ date, value, onSet, onDelete, onClose }) {
  const rootRef = useRef(null);

  const initial = useMemo(() => {
    const taskDay = date ? new Date(date) : new Date();
    let d = null;

    if (value != null) {
      if (typeof value === "number" || value instanceof Date || typeof value === "string") {
        const tmp = new Date(value);
        if (!isNaN(tmp)) d = tmp;
      } else if (typeof value === "object") {
        const base = value.date ? new Date(value.date) : taskDay;
        const hh = typeof value.hour === "number" ? value.hour : base.getHours();
        const mm = typeof value.minute === "number" ? value.minute : base.getMinutes();
        d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, 0, 0);
      }
    }

    if (!d) {
      const now = new Date();
      d = new Date(taskDay.getFullYear(), taskDay.getMonth(), taskDay.getDate(), now.getHours(), now.getMinutes(), 0, 0);
    }

    return {
      day: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      h: d.getHours(),
      m: d.getMinutes(),
      hasValue: value != null,
    };
  }, [date, value]);

  const [day, setDay] = useState(initial.day);
  const [h, setH] = useState(initial.h);
  const [m, setM] = useState(initial.m);
  const hasReminder = initial.hasValue;

  const [hText, setHText] = useState(pad(h));
  const [mText, setMText] = useState(pad(m));
  useEffect(() => setHText(pad(h)), [h]);
  useEffect(() => setMText(pad(m)), [m]);

  useEffect(() => {
    const onDocDown = (e) => { if (!rootRef.current?.contains(e.target)) onClose?.(); };
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("mousedown", onDocDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const shiftDay = (d) => { const nd = new Date(day); nd.setDate(nd.getDate() + d); setDay(nd); };
  const incH = (d = 1) => setH((v) => (v + d + 24) % 24);
  const incM = (d = 1) => setM((v) => (v + d + 60) % 60);

  const onHChange = (e) => setHText(e.target.value.replace(/\D/g, "").slice(0, 2));
  const onMChange = (e) => setMText(e.target.value.replace(/\D/g, "").slice(0, 2));
  const commitH = () => { if (hText === "") return setHText(pad(h)); const n = clamp(parseInt(hText, 10) || 0, 0, 23); setH(n); setHText(pad(n)); };
  const commitM = () => { if (mText === "") return setMText(pad(m)); const n = clamp(parseInt(mText, 10) || 0, 0, 59); setM(n); setMText(pad(n)); };

  const onNumKeyH = (e) => { if (e.key === "ArrowUp") { e.preventDefault(); incH(+1); } else if (e.key === "ArrowDown") { e.preventDefault(); incH(-1); } else if (e.key === "Enter") { e.preventDefault(); commitH(); e.currentTarget.blur(); } };
  const onNumKeyM = (e) => { if (e.key === "ArrowUp") { e.preventDefault(); incM(+1); } else if (e.key === "ArrowDown") { e.preventDefault(); incM(-1); } else if (e.key === "Enter") { e.preventDefault(); commitM(); e.currentTarget.blur(); } };

  const buildEpoch = () => {
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    return d.getTime(); 
  };

  const wrapStyle = {
    minWidth: 300,
    maxWidth: 300,
    padding: 12,
    borderRadius: 14,
    background: "var(--task-card, #E7E9FF)",
    boxShadow: "0 18px 40px rgba(0,0,0,.22)",
    color: "var(--task-text,#0a0a0a)",
  };

  return (
    <div ref={rootRef} className="task-pop reminder-pop" style={wrapStyle} onMouseDown={(e) => e.stopPropagation()}>
    
      <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 30px", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <ArrowBtn dir="left" onClick={() => shiftDay(-1)} title="Ngày trước" />
        <h3 style={{ fontSize: 16, fontWeight: 600, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
          {fmtViFullDate(day)}
        </h3>
        <ArrowBtn dir="right" onClick={() => shiftDay(+1)} title="Ngày sau" />
      </div>


      <div style={{ display: "grid", gridTemplateColumns: "1fr 16px 1fr", alignItems: "center", gap: 8, marginTop: 4 }}>
        
        <div style={{ display: "grid", justifyItems: "center", alignItems: "center", gap: 4 }}>
          <ArrowBtn dir="up" onClick={() => incH(+1)} title="Tăng giờ" />
          <input
            type="text" inputMode="numeric" value={hText}
            onChange={onHChange} onKeyDown={onNumKeyH} onBlur={commitH}
            onFocus={(e) => e.target.select()}
            style={{ width: 80, textAlign: "center", fontSize: 28, fontWeight: 700, border: 0, outline: "none", background: "transparent", color: "inherit" }}
            aria-label="Giờ"
          />
          <div style={{ width: 96, height: 2, background: "rgba(0,0,0,.16)", marginTop: -4, marginBottom: 2 }} />
          <ArrowBtn dir="down" onClick={() => incH(-1)} title="Giảm giờ" />
        </div>

        <div style={{ textAlign: "center", fontSize: 22, fontWeight: 800 }}>:</div>

        <div style={{ display: "grid", justifyItems: "center", alignItems: "center", gap: 4 }}>
          <ArrowBtn dir="up" onClick={() => incM(+1)} title="Tăng phút" />
          <input
            type="text" inputMode="numeric" value={mText}
            onChange={onMChange} onKeyDown={onNumKeyM} onBlur={commitM}
            onFocus={(e) => e.target.select()}
            style={{ width: 80, textAlign: "center", fontSize: 28, fontWeight: 700, border: 0, outline: "none", background: "transparent", color: "inherit" }}
            aria-label="Phút"
          />
          <div style={{ width: 96, height: 2, background: "rgba(0,0,0,.16)", marginTop: -4, marginBottom: 2 }} />
          <ArrowBtn dir="down" onClick={() => incM(-1)} title="Giảm phút" />
        </div>
      </div>

      {/* Action */}
      <div style={{ marginTop: 12 }}>
        <button
          className="primary-btn"
          style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 16, padding: "10px 14px", fontSize: 16, fontWeight: 800, cursor: "pointer" }}
          onClick={() => {
            if (hasReminder) onDelete?.();
            else onSet?.(buildEpoch());
            onClose?.();
          }}
        >
          {hasReminder ? "Xoá nhắc nhở" : "Đặt nhắc nhở"}
        </button>
      </div>
    </div>
  );
}
