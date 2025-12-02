// FE: fe/src/components/modals/TaskModal.jsx - Simplified version without note-taking
import React, { useEffect, useState } from "react";
import "../../styles/task.css";
import "../../styles/notes.css";

import DatePickerPopover from "./popovers/DatePickerPopover.jsx";
import RepeatPopover from "./popovers/RepeatPopover.jsx";
import ReminderPopover from "./popovers/ReminderPopover.jsx";
import ColorPopover from "./popovers/ColorPopover.jsx";
import SharePopover from "./popovers/SharePopover.jsx";
import AttachmentItem from "./items/AttachmentItem.jsx";
import SubtaskItem from "./items/SubtaskItem.jsx";

/* ===== Icons ===== */
const IcoTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M3 6h18M9 6V4h6v2m-8 0l1 14h8l1-14" />
  </svg>
);
const IcoRepeat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M4 7h10l-2-2m2 12H6l2 2M7 12a5 5 0 0 1 10 0" />
  </svg>
);
const IcoBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M12 21a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm7-5H5l1-2v-3a6 6 0 1 1 12 0v3l1 2Z" />
  </svg>
);
const IcoShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.5l7-3M8.6 13.5l7 3" />
  </svg>
);
const IcoMore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="12" cy="6" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="18" r="1.5" />
  </svg>
);
const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

/* ===== Helpers ===== */
function fmtDateVN(d) {
  if (!d) return "";
  const dt = new Date(d);
  const dow = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][dt.getDay()];
  return `${dow}, ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
}

/* Popover layer */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
function PopLayer({ anchor, onClose, children }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState(anchor);

  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const vh = window.innerHeight, vw = window.innerWidth;
    const r = el.getBoundingClientRect();
    const needFlip = anchor.top + r.height > vh - 8;
    const top = needFlip ? Math.max(8, anchor.top - r.height - 16)
                         : Math.min(anchor.top, vh - r.height - 8);
    const left = clamp(anchor.left, 8 + r.width/2, vw - 8 - r.width/2);
    setPos({ top, left });
  }, [anchor]);

  return (
    <div
      className="pop-layer"
      style={{ position: "fixed", inset: 0, zIndex: 10003 }}
      onMouseDown={(e) => { e.stopPropagation(); onClose?.(); }}
    >
      <div
        ref={ref}
        className="pop-body"
        style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateX(-50%)", overflow: "visible" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function TaskModal({
  isOpen,
  task,
  onClose,
  onUpdate,
  onDelete,
  onMoveToTomorrow,
  onMoveToNextWeek,
  onMoveToSomeday,
  onDuplicate,
  onAddAttachment,
  isSomeday
}) {
  const t = task || {};

  /* ===== SAFE TYPE COERCION ===== */
  const subtasksArr = Array.isArray(t.subtasks)
    ? t.subtasks
    : (t.subtasks && typeof t.subtasks === "object" ? Object.values(t.subtasks) : []);
  const attachmentsArr = Array.isArray(t.attachments) ? t.attachments : [];
  const linksArr = Array.isArray(t.links) ? t.links : [];

  // links panel
  const [localLinks, setLocalLinks] = useState(linksArr);
  const [linkOpen, setLinkOpen] = useState(linksArr.length > 0);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkVal, setLinkVal] = useState("");

  // subtasks adder
  const [adderText, setAdderText] = useState("");

  // popovers
  const [openPop, setOpenPop] = useState(null);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });

  /* Effects */
  useEffect(() => {
    if (isOpen) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const safeLinks = linksArr;
    setLocalLinks(safeLinks);
    setLinkOpen(safeLinks.length > 0);
    setIsAddingLink(false);
    setLinkVal("");
    setOpenPop(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, t?.id]); // reset when opening different task

  if (!isOpen) return null;

  /* helpers */
  const openAt = (e, key) => {
    const b = e.currentTarget.getBoundingClientRect();
    setAnchor({ top: b.bottom + 8, left: b.left + b.width / 2 });
    setOpenPop(key);
  };

  const normalizeUrl = (raw) => {
    const v = (raw || "").trim();
    if (!v) return "";
    return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  };

  const toggleLinkPanel = (e) => {
    e?.preventDefault(); e?.stopPropagation();
    setLinkOpen((was) => {
      if (!was) { setIsAddingLink(true); return true; }
      setIsAddingLink((p) => !p);
      return true;
    });
  };

  const addLink = (e) => {
    e?.preventDefault(); e?.stopPropagation();
    const url = normalizeUrl(linkVal);
    if (!url) return;
    if ((localLinks || []).includes(url)) { setLinkVal(""); setIsAddingLink(false); return; }
    const next = [...(localLinks || []), url];
    setLocalLinks(next);
    onUpdate?.({ links: next });
    setLinkVal("");
    setIsAddingLink(false);
  };
  
  const removeLink = (idx, e) => {
    e?.preventDefault(); e?.stopPropagation();
    const next = (localLinks || []).filter((_, i) => i !== idx);
    setLocalLinks(next);
    onUpdate?.({ links: next });
  };

  const handleClose = () => {
    let nextLinks = localLinks;
    const pending = (linkVal || "").trim();
    if (pending) {
      const url = normalizeUrl(pending);
      if (url && !nextLinks.includes(url)) nextLinks = [...nextLinks, url];
      setLocalLinks(nextLinks);
    }
    onUpdate?.({ links: nextLinks });
    setIsAddingLink(false);
    setLinkVal("");
    setOpenPop(null);
    onClose?.();
  };

  const handleToggleDoneAndClose = () => {
    const next = !(t.done ?? t.is_done);
    onUpdate?.({ done: next, is_done: next });
    handleClose();
  };

  /* Subtasks */
  const handleAddSubtask = () => {
    const text = adderText.trim(); if (!text) return;
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    onUpdate?.({
      subtasks: [...subtasksArr, { id, text, done: false, starred: false, heading: false, indent: 0 }]
    });
    setAdderText("");
  };
  
  const updateSubtask = (id, idx, patch) => {
    const next = subtasksArr.map((s, i) => {
      const match = (s?.id != null) ? (s.id === id) : (i === idx);
      return match ? { ...s, ...(patch || {}) } : s;
    });
    onUpdate?.({ subtasks: next });
  };
  
  const deleteSubtask = (id, idx) => {
    const next = subtasksArr.filter((s, i) => {
      const match = (s?.id != null) ? (s.id === id) : (i === idx);
      return !match;
    });
    onUpdate?.({ subtasks: next });
  };

  /* Attachments */
  const addAttachment = (file) => {
    const url = URL.createObjectURL(file);
    const meta = { id: Date.now(), name: file.name, size: file.size, type: file.type, url };
    onUpdate?.({ attachments: [...attachmentsArr, meta] });
    onAddAttachment?.([file]);
  };
  
  const removeAttachment = (id) => {
    onUpdate?.({ attachments: attachmentsArr.filter((a) => a.id !== id) });
  };

  /* Render */
  return (
    <div className="note-editor-overlay" onClick={handleClose}>
      <div className="note-editor-optimized" data-color={t.color || ''} onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="note-editor-header-opt">
          <div></div> {/* Empty div to replace date display */}
          
          <div className="actions-opt">
            <button className="icon-btn" title="Xoá" onClick={onDelete}><IcoTrash /></button>
            {!isSomeday && (
              <button className="icon-btn" title="Lặp lại" onClick={(e) => openAt(e, "repeat")}><IcoRepeat /></button>
            )}
            <button
              className={`icon-btn ico-color ${t.color ? "has-color" : ""}`}
              title="Màu"
              onClick={(e) => openAt(e, "color")}
              style={t.color ? { "--swatch": t.color } : {}}
            >
              <span className="sw" />
            </button>
            <button className="icon-btn" title="Nhắc nhở" onClick={(e) => openAt(e, "reminder")}><IcoBell /></button>
            <button className="icon-btn" title="Chia sẻ" onClick={(e) => openAt(e, "share")}><IcoShare /></button>
            <button className="icon-btn" title="Thêm tuỳ chọn" onClick={(e) => openAt(e, "kebab")}><IcoMore /></button>
          </div>
        </div>

        {/* Title */}
        <input
          autoFocus
          type="text"
          className="note-title-opt"
          value={t.text || ""}
          onChange={(e) => onUpdate?.({ text: e.target.value })}
          placeholder="Tiêu đề công việc"
        />

        {/* Content Area */}
        <div className="note-content-opt">
          <div className="rule-strong" />

          {/* Links panel */}
          <div style={{ marginBottom: 16 }}>
            <button className="tb" title="Quản lý liên kết" onClick={toggleLinkPanel}>🔗 Liên kết</button>
            {linkOpen && (
              <div className="links-panel" style={{ marginTop: 8, display: "grid", gap: 8 }} onMouseDown={(e)=>e.stopPropagation()}>
                {(localLinks || []).map((u, idx) => (
                  <div key={idx} className="link-wrap" style={{ position: "relative" }}>
                    <input
                      className="link-input"
                      value={u}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "10px 148px 10px 12px",
                        border: "1.5px solid #0a0a0a",
                        borderRadius: 12,
                        background: "var(--task-card)",
                        fontSize: 16,
                        outline: "none",
                        color: "var(--task-text)"
                      }}
                    />
                    <div style={{ position: "absolute", right: 8, top: 6, display: "flex", gap: 6 }}>
                      <a
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          height: 32, padding: "0 12px",
                          border: "1.5px solid #0a0a0a",
                          borderRadius: 10,
                          background: "var(--task-card)",
                          display: "inline-flex", alignItems: "center", fontWeight: 800
                        }}
                        onMouseDown={(e)=>e.stopPropagation()}
                      >Mở</a>
                      <button
                        onClick={(e) => removeLink(idx, e)}
                        style={{
                          height: 32, padding: "0 12px",
                          border: "1.5px solid #0a0a0a",
                          borderRadius: 10,
                          background: "var(--task-card)",
                          fontWeight: 800, cursor: "pointer"
                        }}
                        onMouseDown={(e)=>e.stopPropagation()}
                      >Xóa</button>
                    </div>
                  </div>
                ))}

                {isAddingLink && (
                  <div className="link-wrap" style={{ position: "relative" }}>
                    <input
                      id="link-box-input"
                      type="text"
                      value={linkVal}
                      onChange={(e) => setLinkVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); addLink(e); } }}
                      placeholder="www.example.com"
                      className="link-input"
                      style={{
                        width: "100%",
                        padding: "10px 84px 10px 12px",
                        border: "1.5px solid #0a0a0a",
                        borderRadius: 12,
                        background: "var(--task-card)",
                        fontSize: 16,
                        outline: "none",
                        color: "var(--task-text)"
                      }}
                    />
                    <button
                      onClick={(e) => addLink(e)}
                      className="link-btn"
                      style={{
                        position: "absolute", right: 8, top: 6,
                        height: 32, padding: "0 12px",
                        border: "1.5px solid #0a0a0a",
                        background: "var(--task-card)",
                        borderRadius: 10, fontWeight: 800, cursor: "pointer"
                      }}
                      onMouseDown={(e)=>e.stopPropagation()}
                    >Chèn</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div className="subtasks">
            {subtasksArr.map((s, idx) => {
              const safe = {
                id: s?.id ?? undefined,
                text: s?.text ?? "",
                done: !!s?.done,
                starred: !!s?.starred,
                heading: !!s?.heading,
                indent: Number.isFinite(s?.indent) ? s.indent : 0,
              };
              const key = safe.id != null ? `id-${safe.id}` : `idx-${idx}`;
              return (
                <SubtaskItem
                  key={key}
                  data={safe}
                  onChange={(patch) => updateSubtask(safe.id, idx, patch)}
                  onDelete={() => deleteSubtask(safe.id, idx)}
                />
              );
            })}
          </div>

          {attachmentsArr.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {attachmentsArr.map((a) => (
                <AttachmentItem key={a.id} file={a} onDelete={() => removeAttachment(a.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="note-footer-opt">
          <div className="subtask-input-wrapper">
            <div className="circle" />
            <input
              className="subtask-input"
              placeholder="Thêm nhiệm vụ phụ…"
              value={adderText}
              onChange={(e) => setAdderText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); } }}
            />
            <label className="attach-btn" title="Thêm tệp" style={{ cursor: 'pointer' }}>
              🔗
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) addAttachment(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* Popovers */}
        {openPop === "date" && !isSomeday && (
          <PopLayer anchor={anchor} onClose={() => setOpenPop(null)}>
            <DatePickerPopover
              value={t.date}
              onPick={(d) => { onUpdate?.({ date: d }); setOpenPop(null); }}
            />
          </PopLayer>
        )}

        {openPop === "repeat" && !isSomeday && (
          <PopLayer anchor={anchor} onClose={() => setOpenPop(null)}>
            <RepeatPopover
              value={t.repeat_info || t.repeat || { type: "never" }}
              onChange={({ rule }) => { onUpdate?.({ repeat: rule }); setOpenPop(null); }}
              onClose={() => setOpenPop(null)}
            />
          </PopLayer>
        )}

        {openPop === "reminder" && (
          <PopLayer anchor={anchor} onClose={() => setOpenPop(null)}>
            <ReminderPopover
              date={t.date}
              value={t.reminder_info || t.reminder}
              onSet={(val) => onUpdate?.({ reminder: val })}
              onDelete={() => onUpdate?.({ reminder: null })}
              onClose={() => setOpenPop(null)}
            />
          </PopLayer>
        )}

        {openPop === "color" && (
          <PopLayer anchor={anchor} onClose={() => setOpenPop(null)}>
            <ColorPopover
              value={t.color || ""}
              onChange={(c) => onUpdate?.({ color: c })}
              onClose={() => setOpenPop(null)}
            />
          </PopLayer>
        )}

        {openPop === "share" && (
          <SharePopover
            task={t}
            onUpdate={(sharePatch) => onUpdate?.({ share: sharePatch })}
            onClose={() => setOpenPop(null)}
          />
        )}

        {openPop === "kebab" && (
          <PopLayer anchor={anchor} onClose={() => setOpenPop(null)}>
            <div className="task-pop">
              {!isSomeday && (
                <>
                  <button className="menu-item" onClick={() => { onMoveToTomorrow?.(); setOpenPop(null); }}>
                    Chuyển sang ngày mai →
                  </button>

                  <button
                    className="menu-item"
                    onClick={() => { onMoveToNextWeek?.(); setOpenPop(null); }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
                  >
                    <span>Tuần tới</span>
                    <span style={{ display: "inline-flex", color: "#111" }}>
                      <IcoCalendar />
                    </span>
                  </button>

                  <button className="menu-item" onClick={() => { onMoveToSomeday?.(); setOpenPop(null); }}>
                    Đưa xuống Someday ↓
                  </button>
                </>
              )}

              <button className="menu-item" onClick={() => { onDuplicate?.(); setOpenPop(null); }}>
                Nhân bản ⧉
              </button>
            </div>
          </PopLayer>
        )}
      </div>
    </div>
  );
}
