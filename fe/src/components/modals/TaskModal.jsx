// src/components/modals/TaskModal.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "../../styles/task.css";

import DatePickerPopover from "./popovers/DatePickerPopover.jsx";
import RepeatPopover from "./popovers/RepeatPopover.jsx";
import ReminderPopover from "./popovers/ReminderPopover.jsx";
import ColorPopover from "./popovers/ColorPopover.jsx";
import SharePopover from "./popovers/SharePopover.jsx";
import AttachmentItem from "./items/AttachmentItem.jsx";
import SubtaskItem from "./items/SubtaskItem.jsx";

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
const IcoListBullet = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);
const IcoBlockquote = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);

function fmtDateVN(d) {
  if (!d) return "";
  const dt = new Date(d);
  const dow = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][dt.getDay()];
  return `${dow}, ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
}

function placeCaretAtBlock(block, atEnd = true) {
  if (!block) return;
  const r = document.createRange();
  r.selectNodeContents(block);
  r.collapse(!atEnd);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}
function ensureOneEmptyParagraph(host) {
  if (!host) return;
  host.innerHTML = "<p><br/></p>";
  const p = host.querySelector("p");
  placeCaretAtBlock(p, false);
}
function ensureHostHasBlock(host) {
  if (!host) return;
  const hasBlock = host.querySelector("p,div,li");
  if (!hasBlock && host.textContent.trim() === "") ensureOneEmptyParagraph(host);
}
function getOrCreateCurrentBlock(host, focusHost = true) {
  if (!host) return null;
  ensureHostHasBlock(host);
  const sel = window.getSelection();
  const inside = sel && sel.rangeCount > 0 && host.contains(sel.anchorNode);

  if (!inside) {
    if (!focusHost) return host.querySelector("p,div,li");
    host.focus();
    const first = host.querySelector("p,div,li");
    if (first) placeCaretAtBlock(first, false);
  }

  const range = window.getSelection().getRangeAt(0);
  let node = range.startContainer;
  if (node.nodeType === 3) node = node.parentElement;
  while (node && node !== host && !/^(P|DIV|LI)$/i.test(node.tagName)) node = node.parentElement;
  return node && node !== host ? node : host.querySelector("p,div,li");
}

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
  isOpen, task, onClose, onUpdate, onDelete,
  onMoveToTomorrow, onMoveToNextWeek, onMoveToSomeday, onDuplicate,
  isSomeday
}) {
  const notesEl = useRef(null);
  const currentTask = task || {};
  const {
    title = currentTask.text || "",
    notes = "",
    color = "",
    date = new Date(),
    done = false,
    subtasks = [],
    attachments = [],
    repeat = { type: "never" },
    reminder = null,
    links: initLinks = []
  } = currentTask;

  // 🔁 ưu tiên repeat_info, fallback repeat → never
  const repeatValue = currentTask.repeat_info || repeat || { type: "never" };

  const [hOn, setHOn] = useState(false);
  const [bOn, setBOn] = useState(false);
  const [quoteOn, setQuoteOn] = useState(false);
  const [bulletOn, setBulletOn] = useState(false);

  const [localLinks, setLocalLinks] = useState(initLinks || []);
  const [linkOpen, setLinkOpen] = useState((initLinks || []).length > 0);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkVal, setLinkVal] = useState("");

  const [adderText, setAdderText] = useState("");
  const [openPop, setOpenPop] = useState(null);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const el = notesEl.current; if (!el) return;

    if (notes && !/<[a-z]/i.test(notes)) el.textContent = notes;
    else el.innerHTML = notes || "";

    if (!notes || notes.trim() === "") ensureHostHasBlock(el);

    const plain = (el.innerText || "").replace(/\u200B/g, "").trim();
    el.dataset.hastext = plain ? "1" : "";

    const safeLinks = Array.isArray(initLinks) ? initLinks : [];
    setLocalLinks(safeLinks);
    setLinkOpen(safeLinks.length > 0);
    setIsAddingLink(false);
    setLinkVal("");
    setOpenPop(null);
  }, [isOpen, currentTask?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, linkVal, localLinks]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => {
      const blk = getOrCreateCurrentBlock(notesEl.current, false);
      setHOn(!!blk?.classList.contains("hline"));
      setQuoteOn(!!blk?.classList.contains("quote-line"));
      try { setBOn(document.queryCommandState("bold")); } catch {}
      setBulletOn(!!blk && blk.tagName === "LI");
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const openAt = (e, key) => {
    const b = e.currentTarget.getBoundingClientRect();
    setAnchor({ top: b.bottom + 8, left: b.left + b.width / 2 });
    setOpenPop(key);
  };

  const syncNotes = () => {
    const el = notesEl.current;
    if (!el) return;
    onUpdate?.({ notes: el.innerHTML || "" });
    const plain = (el.innerText || "").replace(/\u200B/g, "").trim();
    el.dataset.hastext = plain ? "1" : "";
  };

  const toggleH = () => {
    const blk = getOrCreateCurrentBlock(notesEl.current, true); if (!blk) return;
    blk.classList.toggle("hline");
    setHOn(blk.classList.contains("hline"));
    syncNotes();
  };

  const toggleBold = () => {
    const host = notesEl.current;
    host?.focus();
    document.execCommand("bold");
    try { setBOn(document.queryCommandState("bold")); } catch {}
    syncNotes();
  };

  const toggleQuote = () => {
    const host = notesEl.current;
    const blk = getOrCreateCurrentBlock(host, true); if (!blk) return;

    const willTurnOn = !blk.classList.contains("quote-line");
    if (willTurnOn) {
      if (blk.tagName === "LI") document.execCommand("insertUnorderedList");
      blk.classList.add("quote-line");
    } else {
      blk.classList.remove("quote-line");
    }
    setQuoteOn(blk.classList.contains("quote-line"));
    const cur = getOrCreateCurrentBlock(host, false);
    setBulletOn(!!cur && cur.tagName === "LI");
    syncNotes();
  };

  const toggleBullet = () => {
    const host = notesEl.current; host?.focus();
    const blkBefore = getOrCreateCurrentBlock(host, false);
    if (blkBefore?.classList.contains("quote-line")) {
      blkBefore.classList.remove("quote-line");
      setQuoteOn(false);
    }
    document.execCommand("insertUnorderedList");
    const blk = getOrCreateCurrentBlock(host, false);
    setBulletOn(!!blk && blk.tagName === "LI");
    syncNotes();
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const el = notesEl.current; if (!el) return;
    const blk = getOrCreateCurrentBlock(el, false); if (!blk) return;

    const isLastBlock = blk === Array.from(el.querySelectorAll("p,div,li")).pop();
    const carryH = blk.classList.contains("hline");
    const carryQ = blk.classList.contains("quote-line");

    setTimeout(() => {
      const nb = getOrCreateCurrentBlock(el, false); if (!nb) return;
      if (isLastBlock) {
        if (carryH) nb.classList.add("hline");
        if (carryQ) nb.classList.add("quote-line");
      }
      syncNotes();
    }, 0);
  };

  const normalizeUrl = (raw) => {
    const v = (raw || "").trim();
    if (!v) return "";
    return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  };

  const toggleLinkPanel = (e) => {
    e?.preventDefault(); e?.stopPropagation();
    setLinkOpen((wasOpen) => {
      if (!wasOpen) { setIsAddingLink(true); return true; }
      setIsAddingLink((prev) => !prev);
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
    const patch = {};
    if (notesEl.current) patch.notes = notesEl.current.innerHTML || "";

    let nextLinks = localLinks;
    const pending = (linkVal || "").trim();
    if (pending) {
      const url = normalizeUrl(pending);
      if (url && !nextLinks.includes(url)) nextLinks = [...nextLinks, url];
      setLocalLinks(nextLinks);
    }
    patch.links = nextLinks;

    onUpdate?.(patch);
    setIsAddingLink(false);
    setLinkVal("");
    setOpenPop(null);
    onClose?.();
  };

  const handleToggleDoneAndClose = () => { onUpdate?.({ done: !done }); handleClose(); };

  const handleAddSubtask = () => {
    const text = adderText.trim(); if (!text) return;
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    onUpdate?.({
      subtasks: [
        ...(subtasks || []),
        { id, text, done: false, starred: false, heading: false, indent: 0 }
      ]
    });
    setAdderText("");
  };

  const updateSubtask = (id, idx, patch) => {
    onUpdate?.({
      subtasks: (subtasks || []).map((s, i) => {
        const match = (s?.id != null) ? (s.id === id) : (i === idx);
        return match ? { ...s, ...patch } : s;
      })
    });
  };
  const deleteSubtask = (id, idx) => {
    onUpdate?.({
      subtasks: (subtasks || []).filter((s, i) => {
        const match = (s?.id != null) ? (s.id === id) : (i === idx);
        return !match;
      })
    });
  };

  const addAttachment = (file) => {
    const url = URL.createObjectURL(file);
    const meta = { id: Date.now(), name: file.name, size: file.size, type: file.type, url };
    onUpdate?.({ attachments: [...(attachments || []), meta] });
  };
  const removeAttachment = (id) => {
    onUpdate?.({ attachments: (attachments || []).filter((a) => a.id !== id) });
  };

  return (
    <div
      className="modal-overlay task-overlay"
      onMouseDown={handleClose}
      style={{
        background: "var(--overlay-bg, rgba(0,0,0,.35))",
        backdropFilter: "blur(1px)"
      }}
    >
      <div className="task-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="task-modal__head">
          {!isSomeday && (
            <button className="date-btn" onClick={(e) => openAt(e, "date")} title="Chọn ngày">
              <span className="date-ic"><IcoCalendar /></span>{fmtDateVN(date)}
            </button>
          )}
          <div className="head-icons" style={{ marginLeft: 'auto' }}>
            <button className="ico" title="Xoá" onClick={onDelete}><IcoTrash /></button>
            {!isSomeday && <button className="ico" title="Lặp lại" onClick={(e) => openAt(e, "repeat")}><IcoRepeat /></button>}
            <button className={`ico-color ${color ? "has-color" : ""}`} title="Màu" onClick={(e) => openAt(e, "color")} style={color ? { "--swatch": color } : {}}><span className="sw" /></button>
            <button className="ico" title="Nhắc nhở" onClick={(e) => openAt(e, "reminder")}><IcoBell /></button>
            <button className="ico" title="Chia sẻ" onClick={(e) => openAt(e, "share")}><IcoShare /></button>
            <button className="ico" title="Thêm tuỳ chọn" onClick={(e) => openAt(e, "kebab")}><IcoMore /></button>
          </div>
        </div>

        <div className="title-wrapper">
          <input
            autoFocus
            className="task-title-input"
            value={title}
            onChange={(e) => onUpdate?.({ text: e.target.value, title: e.target.value })}
            placeholder="Tiêu đề công việc"
          />
          <button className={`title-check-btn ${done ? 'is-done' : ''}`} title="Đánh dấu hoàn thành" onClick={handleToggleDoneAndClose}>
            <IcoCheck />
          </button>
        </div>

        <div className="rule-strong" />

        <div className="notes-toolbar">
          <button className={`tb ${hOn ? "on" : ""}`} title="Tiêu đề (phóng to + đậm)" onClick={toggleH}>H</button>
          <button className={`tb ${bOn ? "on" : ""}`} title="In đậm" onClick={toggleBold}>B</button>
          <button className={`tb icon ${bulletOn ? "on" : ""}`} title="Gạch đầu dòng (•)" onClick={toggleBullet}><IcoListBullet/></button>
          <button className={`tb icon ${quoteOn ? "on" : ""}`} title="Trích dẫn (vạch xám)" onClick={toggleQuote}><IcoBlockquote/></button>
          <button className="tb" title="Mở/đóng & hiển thị ô chèn" onClick={toggleLinkPanel}>🔗</button>
        </div>

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

        <div
          ref={notesEl}
          className="task-notes"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          data-placeholder="Thêm ghi chú ở đây"
          onInput={syncNotes}
          onPaste={(e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData("text");
            document.execCommand("insertText", false, text);
          }}
          onFocus={() => ensureHostHasBlock(notesEl.current)}
          onKeyDown={handleKeyDown}
        />

        {/* ===== Subtasks ===== */}
        <div className="subtasks">
          {(subtasks || []).map((s, idx) => {
            const safe = {
              id: s.id ?? undefined,
              text: s.text ?? "",
              done: !!s.done,
              starred: !!s.starred,
              heading: !!s.heading,
              indent: Number.isFinite(s.indent) ? s.indent : 0,
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

          <div className="subtasks__adder">
            <div className="circle" />
            <input
              className="adder-input"
              placeholder="Thêm nhiệm vụ phụ…"
              value={adderText}
              onChange={(e) => setAdderText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); } }}
            />
            <label className="attach-btn" title="Thêm tệp">
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

        {(attachments || []).length > 0 && (
          <div style={{ marginTop: 10 }}>
            {attachments.map((a) => (
              <AttachmentItem key={a.id} file={a} onDelete={() => removeAttachment(a.id)} />
            ))}
          </div>
        )}

        {/* ===== Popovers ===== */}
        {openPop === "date" && (
          <PopLayer anchor={anchor} onClose={() => setOpenPop(null)}>
            <DatePickerPopover
              value={date}
              onPick={(d) => {
                if (typeof onChangeDate === "function") onChangeDate(d, "all");
                else onUpdate?.({ date: d });
                setOpenPop(null);
              }}
            />
          </PopLayer>
        )}

        {openPop === "repeat" && (
          <PopLayer anchor={anchor} onClose={() => setOpenPop(null)}>
            <RepeatPopover
              value={repeatValue}
              onChange={(payload) => {
                const rule = payload?.rule || payload?.repeat || payload?.repeat_info || { type: "never" };
                   if (typeof onChangeRepeat === "function") {
                    onChangeRepeat(rule);
                      } else {
                        onUpdate?.({ repeat: rule, repeat_info: rule });
                         }
                setOpenPop(null);
              }}
              onClose={() => setOpenPop(null)}
            />
          </PopLayer>
        )}

        {openPop === "reminder" && (
          <PopLayer anchor={anchor} onClose={() => setOpenPop(null)}>
            <ReminderPopover
              date={date}
              value={reminder}
              onSet={(val) => onUpdate?.({ reminder: val })}
              onDelete={() => onUpdate?.({ reminder: null })}
              onClose={() => setOpenPop(null)}
            />
          </PopLayer>
        )}

        {openPop === "color" && (
          <PopLayer anchor={anchor} onClose={() => setOpenPop(null)}>
            <ColorPopover
              value={color}
              onChange={(c) => onUpdate?.({ color: c })}
              onClose={() => setOpenPop(null)}
            />
          </PopLayer>
        )}

        {openPop === "share" && (
          <SharePopover
            task={currentTask}
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
