import React, { useState } from "react";

export default function LinkDialog({ onInsert, onClose }) {
  const [url, setUrl] = useState("https://");

  return (
    <div className="task-pop link-dialog" onMouseDown={(e)=>e.stopPropagation()}>
      <div className="title">Chèn liên kết</div>
      <input
        className="txt"
        autoFocus
        value={url}
        onChange={(e)=>setUrl(e.target.value)}
        placeholder="https://..."
      />
      <div className="row end" style={{ gap: 10 }}>
        <button className="soft-btn" onClick={onClose}>Huỷ</button>
        <button className="primary-btn" onClick={()=>onInsert?.(url)}>Chèn</button>
      </div>
    </div>
  );
}
