// src/components/popovers/RepeatPopover.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

/* -------------------- utils -------------------- */
const pad = (n) => String(n).padStart(2, "0");
const sameYMD = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const fmtMonthTitle = (d) => `Tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
const fmtDayShort = (d) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const shallowEqual = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});

function MiniCalendar({ value, minDate, onConfirm }) {
  const min = startOfDay(minDate ?? new Date());
  const [view, setView] = useState(() => {
    const base = startOfDay(value ?? new Date());
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [sel, setSel] = useState(value ? startOfDay(value) : null);

  const cells = React.useMemo(() => {
    const firstDow = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7; // Mon=0
    const start = new Date(view);
    start.setDate(1 - firstDow);
    const arr = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const inMonth = d.getMonth() === view.getMonth();
      const disabled = startOfDay(d) < min;
      arr.push({ d, inMonth, disabled });
    }
    return arr;
  }, [view, min]);

  const goto = (m) => {
    const n = new Date(view);
    n.setMonth(n.getMonth() + m);
    setView(n);
  };

  const canReset = !!sel;

  return (
    <div
      style={{
        position:"absolute", left:0, right:0, marginTop:10,
        background:"var(--task-card,#E7E9FF)",
        border:"1px solid var(--task-line,rgba(0,0,0,.12))",
        borderRadius:14, boxShadow:"0 14px 40px rgba(0,0,0,.22)",
        padding:12, zIndex:5,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <button onClick={() => goto(-1)} style={navBtn}>{"<"}</button>
        <div style={{ fontWeight: 800 }}>{fmtMonthTitle(view)}</div>
        <button onClick={() => goto(+1)} style={navBtn}>{">"}</button>
      </div>

      <div style={{
        display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6,
        fontWeight:700, color:"rgba(0,0,0,.55)", marginBottom:6, textAlign:"center"
      }}>
        {["T2","T3","T4","T5","T6","T7","CN"].map((w) => <div key={w}>{w}</div>)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
        {cells.map(({ d, inMonth, disabled }, i) => {
          const selected = sel && sameYMD(d, sel);
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => setSel(startOfDay(d))}
              style={{
                aspectRatio:"1/1",
                borderRadius:10,
                border:"1px solid var(--task-line,rgba(0,0,0,.12))",
                background: selected? "#0a0a0a" : disabled? "rgba(0,0,0,.06)" : inMonth? "rgba(255,255,255,.55)" : "transparent",
                color: selected? "#fff" : "inherit",
                fontWeight:800,
                cursor: disabled? "not-allowed" : "pointer",
                opacity: disabled? .45 : 1,
              }}
              title={fmtDayShort(d)}
            >
              {pad(d.getDate())}
            </button>
          );
        })}
      </div>

      <div style={{ display:"flex", gap:10, marginTop:12 }}>
        <button
          className="soft-btn"
          style={{ flex:"0 0 120px", opacity: canReset? 1 : .5, cursor: canReset? "pointer" : "default" }}
          disabled={!canReset}
          onClick={() => setSel(null)}
        >
          Đặt lại
        </button>
        <button className="primary-btn" style={{ flex:1 }} onClick={() => onConfirm?.(sel)}>
          Áp dụng
        </button>
      </div>
    </div>
  );
}
const navBtn = { width:34, height:30, border:0, borderRadius:10, background:"rgba(0,0,0,.06)", fontWeight:900, cursor:"pointer" };

function ConfirmRecurrence({ open, onApply, onCancel, onDismiss }) {
  useEffect(() => {
    if (!open) return;
    const overlay = document.querySelector(".task-overlay");
    const modal   = document.querySelector(".task-modal");

    const prevOverlayDisplay = overlay?.style.display ?? "";
    const prevModalDisplay   = modal?.style.display ?? "";

    if (overlay) overlay.style.display = "none";
    if (modal)   modal.style.display   = "none";

    const onKey = (e) => { if (e.key === "Escape") onDismiss?.(); };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      if (overlay) overlay.style.display = prevOverlayDisplay;
      if (modal)   modal.style.display   = prevModalDisplay;
    };
  }, [open, onDismiss]);

  if (!open) return null;

  return createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onDismiss?.(); }}
      style={{
        position:"fixed", inset:0, zIndex:10050,
        background:"rgba(0,0,0,.40)", backdropFilter:"blur(1.5px)",
        display:"flex", justifyContent:"center", alignItems:"flex-start",
        overflow:"auto", padding:"70px 0"
      }}
    >
      <div
        onMouseDown={(e)=>e.stopPropagation()}
        role="dialog" aria-modal="true"
        style={{
          width: "min(560px, calc(100vw - 32px))",
          background:"#F4ECE6",
          border:"1px solid rgba(0,0,0,.1)",
          borderRadius:22,
          boxShadow:"0 22px 80px rgba(0,0,0,.28)",
          padding:"20px 22px"
        }}
      >
        <div style={{ fontSize:24, fontWeight:900, marginBottom:12 }}>Thay đổi thiết lập lặp?</div>
        <div style={{ fontSize:18, lineHeight:1.5, opacity:.9 }}>
          Bạn chắc chắn muốn thay đổi thiết lập lặp của công việc? Việc này sẽ kết thúc chu kỳ hiện tại
          và các bản xuất hiện trong tương lai có thể được làm mới theo quy tắc mới.
        </div>

        <div style={{ display:"flex", gap:14, marginTop:18 }}>
          <button
            onClick={onApply}
            className="primary-btn"
            style={{ flex:1, height:48, borderRadius:16, fontWeight:900 }}
          >
            Áp dụng
          </button>
          <button
            onClick={onCancel}
            className="soft-btn"
            style={{ flex:1, height:48, borderRadius:16, fontWeight:900 }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function RepeatPopover({ value, onChange, onClose }) {
  // Hỗ trợ cả value là rule trực tiếp hoặc bọc trong {repeat|repeat_info}
  const current = useMemo(() => {
    if (!value) return { type: "never" };
    if (value.type) return value;
    return value.repeat || value.repeat_info || { type: "never" };
  }, [value]);

  const [screen, setScreen] = useState("menu");
  const [interval, setInterval] = useState(1);
  const [unit, setUnit] = useState("day");
  const [end, setEnd] = useState("never");
  const [until, setUntil] = useState(null);
  const [showEndCal, setShowEndCal] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRule, setPendingRule] = useState(null);

  useEffect(() => {
    if (current?.type === "custom") {
      setInterval(current.interval || 1);
      setUnit(current.unit || "day");
      setEnd(current.end || "never");
      setUntil(current.until ? new Date(current.until) : null);
    } else {
      setInterval(1);
      setUnit("day");
      setEnd("never");
      setUntil(null);
    }
  }, [current]);

  const summary = useMemo(() => {
    if (screen !== "custom") {
      const map = {
        never: "Không lặp lại",
        daily: "Lặp lại mỗi ngày",
        weekly: "Lặp lại mỗi tuần",
        weekdays: "Lặp lại các ngày trong tuần",
        biweekly: "Lặp lại mỗi 2 tuần",
        monthly: "Lặp lại mỗi tháng",
        yearly: "Lặp lại mỗi năm",
        custom: "Tùy chỉnh",
      };
      return map[current?.type || "never"];
    }
    const uMap = { day:"ngày", week:"tuần", month:"tháng", year:"năm" };
    const core = `Lặp lại mỗi ${interval} ${uMap[unit]}`;
    if (end === "on" && until) return `${core} đến ${fmtDayShort(until)}`;
    return core;
  }, [screen, current, interval, unit, end, until]);

  // ✅ Phát sự kiện theo cả 2 key để TaskModal/App bắt được
  const emitChange = (rule) => {
    onChange?.({ rule, repeat: rule, repeat_info: rule, scope: "this-and-future" });
    onClose?.();
  };

  const requestChange = (nextRule) => {
    const isDifferent = !shallowEqual(current, nextRule);
    if (current.type && current.type !== "never" && isDifferent) {
      setPendingRule(nextRule);
      setConfirmOpen(true);
      return;
    }
    emitChange(nextRule);
  };

  const quickSelect = (type) => requestChange({ type });

  if (confirmOpen) {
    return (
      <ConfirmRecurrence
        open={confirmOpen}
        onApply={() => { emitChange(pendingRule); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); onClose?.(); }}
        onDismiss={() => { setConfirmOpen(false); onClose?.(); }}
      />
    );
  }

  if (screen === "menu") {
    const checked = (t) => current?.type === t || (!current && t === "never");
    const Item = ({ label, onClick, right }) => (
      <button
        className="menu-item"
        onClick={onClick}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}
      >
        <span>{label}</span>
        {right}
      </button>
    );

    return (
      <div className="task-pop repeat-pop" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="pop-list">
          <Item label="Không bao giờ"       onClick={() => quickSelect("never")}     right={checked("never")     ? "✓" : null} />
          <Item label="Hàng ngày"           onClick={() => quickSelect("daily")}     right={checked("daily")     ? "✓" : null} />
          <Item label="Hàng tuần"           onClick={() => quickSelect("weekly")}    right={checked("weekly")    ? "✓" : null} />
          <Item label="Ngày trong tuần"     onClick={() => quickSelect("weekdays")}  right={checked("weekdays")  ? "✓" : null} />
          <Item label="Hai tuần một lần"    onClick={() => quickSelect("biweekly")}  right={checked("biweekly")  ? "✓" : null} />
          <Item label="Hàng tháng"          onClick={() => quickSelect("monthly")}   right={checked("monthly")   ? "✓" : null} />
          <Item label="Hàng năm"            onClick={() => quickSelect("yearly")}    right={checked("yearly")    ? "✓" : null} />
          <Item label="Tùy chỉnh"           onClick={() => setScreen("custom")}      right={<span style={{ fontWeight: 900 }}>{">"}</span>} />
        </div>
      </div>
    );
  }

  const applyCustom = () => {
    const rule = {
      type: "custom",
      interval: Math.max(1, parseInt(interval || 1, 10)),
      unit,
      end,
      ...(end === "on" && until ? { until } : {}),
    };
    requestChange(rule);
  };

  const today = startOfDay(new Date());

  return (
    <div className="task-pop repeat-pop repeat-custom" onMouseDown={(e)=>e.stopPropagation()} style={{ minWidth: 420 }}>
      <div className="row" style={{ gap:16, alignItems:"center" }}>
        <div className="label">Mỗi</div>
        <input
          className="num"
          value={interval}
          onChange={(e)=>setInterval(e.target.value.replace(/\D/g,"").slice(0,3))}
        />
        <div style={{ width:10 }} />
        <div className="like-input" style={{ display:"flex", alignItems:"center" }}>
          <select value={unit} onChange={(e)=>setUnit(e.target.value)}>
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </div>
      </div>

      <div className="row" style={{ gap:16, alignItems:"center", marginTop:12, position:"relative" }}>
        <div className="label">Kết thúc</div>
        <div className="like-input" style={{ flex:1, position:"relative" }}>
          <select
            value={end}
            onChange={(e) => {
              const v = e.target.value;
              setEnd(v);
              if (v === "on") setShowEndCal(true);
              else { setShowEndCal(false); setUntil(null); }
            }}
          >
            <option value="never">Không bao giờ</option>
            <option value="on">{until ? fmtDayShort(until) : "Chọn một ngày…"}</option>
          </select>

          {end === "on" && showEndCal && (
            <MiniCalendar
              value={until}
              minDate={today}
              onConfirm={(picked) => { setUntil(picked || null); setShowEndCal(false); }}
            />
          )}
        </div>
      </div>

      <div className="summary" style={{ marginTop: 6 }}>{summary}</div>

      <div className="row end" style={{ gap:10, marginTop:14 }}>
        <button className="primary-btn" style={{ width:"100%" }} onClick={applyCustom}>
          Áp dụng
        </button>
      </div>
    </div>
  );
}
