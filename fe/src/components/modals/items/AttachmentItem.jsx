// src/components/modals/items/AttachmentItem.jsx
import React from "react";

function formatSize(bytes = 0) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentItem({ file = {}, onDelete }) {
  const { id, name = "Tệp đính kèm", size = 0, type = "", url } = file || {};

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "attachment";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      className="attach-row"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 10,
        background: "rgba(255,255,255,.5)",
        border: "1px solid var(--task-line)",
        borderRadius: 12,
      }}
    >
      <div className="file-icon" aria-hidden>📎</div>
      <div className="file-meta" style={{ lineHeight: 1.2 }}>
        <div className="name" style={{ fontWeight: 800, fontSize: 12 }}>
          {name}
        </div>
        <div className="sub" style={{ color: "var(--task-muted)", fontSize: 11 }}>
          {type || "tệp"} • {formatSize(size)}
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleDownload}
          title="Tải xuống"
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: "1.5px solid #0a0a0a",
            background: "var(--task-card)",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Tải xuống
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(id)}
          title="Xoá tệp"
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: "1.5px solid #0a0a0a",
            background: "var(--task-card)",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Xóa
        </button>
      </div>
    </div>
  );
}

export default AttachmentItem; 
