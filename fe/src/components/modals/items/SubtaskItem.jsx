// src/components/modals/items/SubtaskItem.jsx
import React, { useRef, useState, useLayoutEffect } from "react";

const IcoDots = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
  </svg>
);
const IcoCheckMini = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

function MiniPopover({ anchorRect, onClose, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !anchorRect) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const { width: mw, height: mh } = el.getBoundingClientRect();

    let top = anchorRect.bottom + 8;
    let left = anchorRect.left + anchorRect.width - mw;
    if (top + mh > vh - 8) top = anchorRect.top - mh - 8;
    left = Math.max(8, Math.min(left, vw - mw - 8));
    setPos({ top, left });
  }, [anchorRect]);

  if (!anchorRect) return null;
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: "fixed", inset: 0, zIndex: 10020 }}
    >
      <div
        ref={ref}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: pos.top, left: pos.left,
          minWidth: 230,
          background: "var(--task-card)",
          color: "var(--task-text)",
          border: "1.5px solid #0a0a0a",
          borderRadius: 14,
          boxShadow: "0 14px 50px rgba(0,0,0,.25)",
          padding: 10
        }}
      >
        {children}
      </div>
    </div>
  );
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        border: "1px solid transparent",
        background: "transparent",
        padding: "8px 10px",
        borderRadius: 10,
        cursor: "pointer",
        fontSize: 15,
        fontWeight: 700,
        color: danger ? "#dc2626" : "var(--task-text)"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

/*SubtaskItem */
const INDENT_STEP = 5;     
const INDENT_MAX  = 25;   

export default function SubtaskItem({ data, onChange, onDelete }) {
  const { id, text = "", done = false, starred = false, heading = false, indent = 0 } = data || {};

  const rowRef = useRef(null);
  const inputRef = useRef(null);

  const [hover, setHover] = useState(false);
  const [menuRect, setMenuRect] = useState(null);

  const patch = (p) => onChange?.(p);

  const toggleDone    = () => patch({ done: !done });
  const toggleStar    = () => patch({ starred: !starred });
  const toggleHeading = () => patch({ heading: !heading });

  const canIndent  = (indent || 0) < INDENT_MAX / INDENT_STEP;
  const canOutdent = (indent || 0) > 0;

  const doIndent  = () => { if (canIndent)  patch({ indent: Math.min((indent || 0) + 1, INDENT_MAX / INDENT_STEP) }); };
  const doOutdent = () => { if (canOutdent) patch({ indent: Math.max((indent || 0) - 1, 0) }); };

  const openMenuWith = (btn) => setMenuRect(btn.getBoundingClientRect());
  const closeMenu = () => setMenuRect(null);

  const leftOffset = Math.min((indent || 0) * INDENT_STEP, INDENT_MAX);

  return (
    <div
      ref={rowRef}
      className={"subtask-row" + (done ? " is-done" : "") + (starred ? " is-starred" : "") + (heading ? " is-heading" : "")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 6px", position: "relative" }}
      data-subtask-id={id}
    >
     
      <button
        type="button"
        className={"circle" + (done ? " checked" : "")}
        onClick={toggleDone}
        aria-label={done ? "Bỏ hoàn thành" : "Hoàn thành"}
      >
        {done && <IcoCheckMini />}
      </button>

      <div className="subtask-main" style={{ marginLeft: leftOffset, flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        <input
          ref={inputRef}
          className="subtask-input"
          placeholder="Tên nhiệm vụ phụ"
          value={text}
          onChange={(e) => patch({ text: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          style={{ flex: 1, background: "transparent", border: 0, outline: "none", fontSize: 15, lineHeight: 1.3 }}
        />
      </div>

      {starred ? (
        <button
          type="button"
          title="Tùy chọn"
          onClick={(e) => openMenuWith(e.currentTarget)}
          style={{ border: 0, background: "transparent", cursor: "pointer", color: "#111", fontSize: 18, lineHeight: 1, padding: 4 }}
        >
          ★
        </button>
      ) : (
        <button
          type="button"
          className="subtask-more-btn"
          onClick={(e) => openMenuWith(e.currentTarget)}
          title="Tùy chọn"
          style={{
            opacity: hover ? 1 : 0,
            transition: "opacity .15s",
            border: 0, background: "transparent", cursor: "pointer",
            width: 28, height: 28, display: "grid", placeItems: "center"
          }}
        >
          <IcoDots />
        </button>
      )}

      {menuRect && (
        <MiniPopover anchorRect={menuRect} onClose={closeMenu}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          
            <MenuItem onClick={() => { toggleStar(); closeMenu(); }}>
              {starred ? "Bỏ sao" : "Gắn sao"}
            </MenuItem>

            <MenuItem onClick={() => { toggleHeading(); closeMenu(); }}>
              {heading ? "Bỏ định dạng tiêu đề" : "Định dạng tiêu đề"}
            </MenuItem>

            {canIndent && (
              <MenuItem onClick={() => { doIndent(); closeMenu(); }}>
                Thụt vào
              </MenuItem>
            )}
            {canOutdent && (
              <MenuItem onClick={() => { doOutdent(); closeMenu(); }}>
                Thụt ra
              </MenuItem>
            )}

            <div style={{ height: 1, background: "rgba(0,0,0,.12)", margin: "6px 0" }} />
            <MenuItem danger onClick={() => { onDelete?.(); closeMenu(); }}>
              Xoá
            </MenuItem>
          </div>
        </MiniPopover>
      )}
    </div>
  );
}
