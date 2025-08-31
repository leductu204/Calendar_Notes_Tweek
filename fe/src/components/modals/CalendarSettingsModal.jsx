// src/components/modals/CalendarSettingsModal.jsx
import React, { useEffect, useMemo, useState } from "react";

const ExportIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/>
    <path d="M12 12v6"/>
    <path d="M9.5 15.5 12 18l2.5-2.5"/>
  </svg>
);

const emailOk = (s) => /\S+@\S+\.\S+/.test((s || "").trim());
const avatarText = (email) => (email || "?").trim()[0]?.toUpperCase() || "U";
const btoaUnicode = (str) => { try { return btoa(unescape(encodeURIComponent(str))); } catch { return ""; } };
const initialsOf = (name = "") =>
  name.trim().split(/\s+/).map(w => w[0]?.toUpperCase()).slice(0, 2).join("");

function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange?.(!checked)}
      aria-pressed={checked}
      disabled={disabled}
      style={{
        width: 48, height: 28, borderRadius: 999,
        border: "1px solid rgba(0,0,0,.18)",
        background: disabled ? "#e9e9e9" : checked ? "rgba(0,0,0,.85)" : "#f1f1f1",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        style={{
          position: "absolute", top: 3, left: checked ? 24 : 3,
          width: 22, height: 22, borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.25)", transition: "left .18s ease",
        }}
      />
    </button>
  );
}

function ExportModal({ open, onClose, onStart }) {
  if (!open) return null;

  const MODAL_W = 515, PURPLE_BG = "#E7DAF6";
  const iso = (d) => new Date(d).toISOString().slice(0, 10);
  const first = (d=new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
  const last  = (d=new Date()) => new Date(d.getFullYear(), d.getMonth()+1, 0);

  const todayIso = iso(new Date());
  const [from, setFrom] = useState(() => {
    const f = iso(first());
    return f > todayIso ? todayIso : f;
  });
  const [to, setTo] = useState(() => {
    const t = iso(last());
    return t > todayIso ? todayIso : t;
  });
  const [fmt, setFmt] = useState("TXT");

  const onChangeFrom = (v0) => {
    let v = v0;
    if (v > todayIso) v = todayIso;
    if (v > to) setTo(v);
    setFrom(v);
  };
  const onChangeTo = (v0) => {
    let v = v0;
    if (v > todayIso) v = todayIso;
    if (v < from) setFrom(v);
    setTo(v);
  };
  const start = () => { onStart?.({ from, to, format: fmt }); onClose?.(); };

  return (
    <div
      onMouseDown={(e)=>{ if (e.target===e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10001,
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        overflow: "auto", padding: "70px 0",
        background: "rgba(0,0,0,.35)"
      }}
    >
      <div
        onMouseDown={(e)=>e.stopPropagation()}
        style={{
          width: MODAL_W,
          background: PURPLE_BG, borderRadius: 28,
          boxShadow: "0 24px 80px rgba(0,0,0,.35)", padding: 26,
          display:"flex", flexDirection:"column",
        }}
      >
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, display:"grid", placeItems:"center", background:"rgba(0,0,0,.08)" }}>
            <ExportIcon />
          </div>
          <h2 style={{ margin:0, fontSize:28, fontWeight:900 }}>Xuất tệp</h2>
        </div>

        <p style={{ margin:"2px 0 18px", lineHeight:1.5 }}>
          Tải dữ liệu của bạn về dạng TXT hoặc XML để sao lưu.
        </p>

        <div style={{ fontWeight:800, marginBottom:12 }}>Khoảng ngày và định dạng</div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
          <div style={{ borderBottom:"2px solid rgba(0,0,0,.45)", paddingBottom:8 }}>
            <input type="date" value={from} onChange={(e)=>onChangeFrom(e.target.value)}
                   max={(to && to < todayIso) ? to : todayIso}
                   style={fieldInput}/>
          </div>
          <div style={{ borderBottom:"2px solid rgba(0,0,0,.45)", paddingBottom:8 }}>
            <input type="date" value={to} onChange={(e)=>onChangeTo(e.target.value)}
                   min={from} max={todayIso} style={fieldInput}/>
          </div>
        </div>

        <div style={{ marginTop:18 }}>
          <div style={{ borderBottom:"2px solid rgba(0,0,0,.45)", paddingBottom:8 }}>
            <select value={fmt} onChange={(e)=>setFmt(e.target.value)} style={{ ...fieldInput, cursor:"pointer" }}>
              <option value="TXT">TXT</option>
              <option value="XML">XML</option>
            </select>
          </div>
        </div>

        <div style={{ display:"flex", gap:12, marginTop:"auto" }}>
          <button onClick={start}
                  style={{ padding:"14px 22px", borderRadius:999, border:0, background:"#111", color:"#fff", fontWeight:900, cursor:"pointer" }}>
            Bắt đầu tạo
          </button>
          <button onClick={onClose}
                  style={{ padding:"14px 22px", borderRadius:999, border:"2px solid #111", background:"transparent", fontWeight:800, cursor:"pointer" }}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
const fieldInput = { width:"100%", fontSize:18, fontWeight:700, background:"transparent", border:"none", outline:"none", paddingRight:10 };

export default function CalendarSettingsModal({ open, onClose }) {
  const owner = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("app.user") || "{}");
      return { name: u.name || u.email || "Bạn", email: u.email || "" };
    } catch { return { name: "Bạn", email: "" }; }
  }, []);

  const [openExport, setOpenExport] = useState(false);

  const [st, setSt] = useState({
    publishLink: false,
    moveUncompletedToday: false,
    sortCompleted: false,
    hideCompleted: false,
  });

  const [invites, setInvites] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem("calendar.settings") || "{}");
      setSt((s) => ({ ...s, ...savedSettings }));
      const savedInvites = JSON.parse(localStorage.getItem("calendar.invites") || "[]");
      setInvites(savedInvites);
    } catch {}
  }, []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const saveSettings = (next) => {
    setSt(next);
    localStorage.setItem("calendar.settings", JSON.stringify(next));
  
    window.dispatchEvent(new CustomEvent("calendar:settings", { detail: next }));
  };

  const saveInvites = (nextInvites) => {
    setInvites(nextInvites);
    localStorage.setItem("calendar.invites", JSON.stringify(nextInvites));
  };

  const link = useMemo(
    () => `${location.origin}/public/cal/${btoaUnicode(owner.email || owner.name).replace(/=/g, "")}`,
    [owner]
  );

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); alert("Đã sao chép liên kết."); }
    catch { alert("Không sao chép được. Hãy chọn & copy thủ công."); }
  };

  const addInvite = () => {
    const email = inviteEmail.trim();
    if (!emailOk(email)) return;
    if (invites.includes(email) || email === owner.email) {
      alert("Email này đã tồn tại hoặc là chủ sở hữu."); return;
    }
    const next = [...invites, email];
    saveInvites(next);
    setInviteEmail(""); setShowInvite(false);
  };

  const removeInvite = (emailToRemove) => {
    const next = invites.filter((em) => em !== emailToRemove);
    saveInvites(next);
  };

  if (!open) return null;
  if (openExport) {
    return (
      <ExportModal
        open={openExport}
        onClose={() => setOpenExport(false)}
        onStart={(payload)=>{ console.log("Export payload:", payload); }}
      />
    );
  }

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        overflow: "auto", padding: "70px 0",
        background: "rgba(0,0,0,.35)"
      }}
    >
      <div onMouseDown={(e) => e.stopPropagation()} style={styles.modalBody}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: 24 }}>Cài đặt lịch</h2>
          <button
            title="Xuất tệp"
            onClick={() => setOpenExport(true)}
            style={{ marginLeft: "auto", border: 0, background: "transparent", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer" }}
          >
            <ExportIcon />
          </button>
        </div>

        <section style={styles.darkSection}>
          <div style={{ flex: 1 }}>
            <div style={{ opacity: 0.8, fontSize: 13 }}>Chia sẻ lên web</div>
            <div style={{ fontWeight: 800 }}>Xuất liên kết chỉ đọc</div>
            {st.publishLink && (
              <div style={styles.linkContainer}>
                <code style={styles.linkCode}>{link}</code>
                <button onClick={copyLink} style={styles.copyButton}>Sao chép</button>
              </div>
            )}
          </div>
          <Switch
            checked={st.publishLink}
            onChange={(v) => saveSettings({ ...st, publishLink: v })}
          />
        </section>

        <section style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Thành viên</div>

          <div style={styles.memberRow}>
            <div style={styles.avatar}>{initialsOf(owner.name)}</div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontWeight: 700 }}>{owner.name}</div>
              {owner.email && <div style={{ opacity: 0.7, fontSize: 13 }}>{owner.email}</div>}
            </div>
            <span style={styles.ownerBadge}>Chủ sở hữu</span>
          </div>

          {invites.map((email) => (
            <div key={email} style={styles.memberRow}>
              <div style={styles.avatar}>{avatarText(email)}</div>
              <div style={{ flex: 1, lineHeight: 1.3 }}>
                <div style={{ fontWeight: 700 }}>{email}</div>
              </div>
              <button onClick={() => removeInvite(email)} style={styles.removeButton}>Gỡ</button>
            </div>
          ))}

          {showInvite ? (
            <div style={{ display:"flex", gap: 8, alignItems:"center", marginTop: 8 }}>
              <input
                style={styles.emailInput}
                placeholder="Nhập email để mời..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
              />
              <button
                style={{ ...styles.primaryButton, padding: "10px 16px", opacity: emailOk(inviteEmail) ? 1 : 0.5 }}
                disabled={!emailOk(inviteEmail)}
                onClick={addInvite}
              >
                Gửi
              </button>
            </div>
          ) : (
            <button
              type="button"
              style={{ ...styles.primaryButton, marginTop: 8 }}
              onClick={() => setShowInvite(true)}
            >
              Thêm người
            </button>
          )}
        </section>
        <h3 style={styles.sectionHeader}>Lịch của tôi</h3>

        <section style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Tính năng</div>
          <Row title="Tự động: Chuyển công việc chưa hoàn thành về Hôm nay"
               checked={st.moveUncompletedToday}
               onChange={(v) => saveSettings({ ...st, moveUncompletedToday: v })}/>
          <Row title="Tự động: Sắp xếp công việc đã hoàn thành"
               checked={st.sortCompleted}
               onChange={(v) => saveSettings({ ...st, sortCompleted: v })}/>
          <Row title="Tự động: Ẩn công việc đã hoàn thành"
               checked={st.hideCompleted}
               onChange={(v) => saveSettings({ ...st, hideCompleted: v })}/>
        </section>
      </div>
    </div>
  );
}

function Row({ title, checked, onChange, disabled }) {
  return (
    <div style={styles.featureRow}>
      <div style={{ flex: 1 }}>{title}</div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

const styles = {
  modalBody: {
    width: "min(780px, 94vw)",
    borderRadius: 24,
    background: "#E9DDFC",
    border: "1px solid rgba(0,0,0,.12)",
    boxShadow: "0 24px 80px rgba(0,0,0,.35)",
    padding: 22,
  
  },
  darkSection: { marginTop: 16, background: "#111", color: "#fff", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 16 },
  linkContainer: { marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  linkCode: { background: "rgba(255,255,255,.08)", padding: "6px 8px", borderRadius: 8, fontSize: 13 },
  copyButton: { padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,.5)", background: "transparent", color: "#fff", cursor: "pointer" },
  memberRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0" },
  avatar: { width: 46, height: 46, borderRadius: "50%", border: "1px solid rgba(0,0,0,.2)", background: "#fff", display: "grid", placeItems: "center", fontWeight: 900, flexShrink: 0 },
  ownerBadge: { marginLeft: "auto", fontSize: 12, fontWeight: 800, background: "#e7dcff", padding: "4px 10px", borderRadius: 999 },
  primaryButton: { padding: "12px 18px", borderRadius: 999, background: "#111", color: "#fff", fontWeight: 900, border: 0, cursor: "pointer" },
  emailInput: { flex: 1, padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(0,0,0,.1)", fontSize: "16px", outline: "none" },
  removeButton: { marginLeft: "auto", padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,0,0,.25)", background: "#fff", color: "#b00020", cursor: "pointer", fontWeight: 700 },
  sectionHeader: { marginTop: 22, borderTop: "1px solid rgba(0,0,0,.08)", paddingTop: 16 },
  featureRow: { display: "flex", alignItems: "center", padding: "12px 0", borderTop: "1px solid rgba(0,0,0,.06)", gap: 12 },
};
