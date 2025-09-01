// src/components/modals/popovers/SharePopover.jsx
import React, { useEffect, useMemo, useState } from "react";

const emailOk = (s) => /\S+@\S+\.\S+/.test((s || "").trim());
const makeToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const buildLink = (tkn) => `${location.origin}/s/t/${tkn}`;
const avatarText = (email) => (email || "?").trim()[0]?.toUpperCase() || "U";

export default function SharePopover({ task, onUpdate, onClose }) {
  // Ưu tiên share_info, fallback share (để tương thích dữ liệu cũ)
  const shareSrc = task?.share_info ?? task?.share ?? {};

  const [enabled, setEnabled] = useState(!!shareSrc.enabled);
  const [token, setToken]     = useState(shareSrc.token || "");
  const [invites, setInvites] = useState(shareSrc.invites || []);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite]   = useState("");

  useEffect(() => {
    const s = task?.share_info ?? task?.share ?? {};
    setEnabled(!!s.enabled);
    setToken(s.token || "");
    setInvites(s.invites || []);
  }, [task?.share_info, task?.share]);

  const link = useMemo(() => (token ? buildLink(token) : ""), [token]);

  // Luôn phát patch dưới key share_info để đồng bộ với DataContext/adapter
  const persist = (next) => onUpdate?.({ share_info: next });

  const toggle = (v) => {
    let nextToken = token;
    if (v && !nextToken) nextToken = makeToken();
    setEnabled(v);
    if (nextToken !== token) setToken(nextToken);
    persist({ enabled: v, token: nextToken, invites });
  };

  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); } catch {}
  };

  const addInvite = () => {
    const em = (invite || "").trim();
    if (!emailOk(em)) return;
    const next = Array.from(new Set([...(invites || []), em]));
    setInvites(next);
    setInvite("");
    persist({ enabled, token, invites: next });
  };

  const removeInvite = (em) => {
    const next = (invites || []).filter((x) => x !== em);
    setInvites(next);
    persist({ enabled, token, invites: next });
  };

  const WRAP_W = 515;
  const TOP_GAP = 80;
  const MIN_H = 290;
  const WRAP_BG = "#E7DAF6";

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 10003,
    background: "transparent",
  };

  const wrapStyle = {
    position: "fixed",
    zIndex: 10004,
    top: TOP_GAP,
    left: `calc(50% - ${WRAP_W / 2}px)`,
    width: WRAP_W,
    minHeight: MIN_H,
    maxHeight: `calc(100vh - ${TOP_GAP + 40}px)`,
    overflowY: "auto",
    background: WRAP_BG,
    borderRadius: 28,
    boxShadow: "0 24px 80px rgba(0,0,0,.35)",
    padding: 24,
    fontFamily: "sans-serif",
  };

  return (
    <>
      {/* click ra ngoài để đóng */}
      <div style={backdropStyle} onMouseDown={onClose} />

      <div style={wrapStyle} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 style={{ margin: "0 0 16px", fontSize: 28, fontWeight: 900 }}>Chia sẻ công việc</h2>

        <div style={s.card}>
          <div style={s.topRow}>
            <div>
              <div style={s.cardSub}>Chia sẻ lên web</div>
              <div style={s.cardTitle}>
                {enabled ? "Ai có liên kết có thể xem" : "Xuất liên kết chỉ đọc"}
              </div>
            </div>

            <div style={s.switchContainer}>
              <button
                type="button"
                style={s.switch}
                onClick={() => toggle(!enabled)}
                aria-pressed={enabled}
              >
                <span style={{ ...s.knob, ...(enabled ? s.knobOn : {}) }} />
              </button>
            </div>
          </div>

          {enabled && (
            <div style={{ ...s.linkBox, background: WRAP_BG, border: "1.5px solid rgba(0,0,0,.08)" }}>
              <input
                style={s.linkInput}
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
              />
              <button style={s.copyButton} onClick={copy}>Sao chép</button>
            </div>
          )}
        </div>

        <div style={s.infoPanel}>
          <div>
            <div style={s.infoTitle}>Thêm người hoặc chỉ cần chia sẻ link</div>
            <div style={s.infoSub}>để cộng tác trên công việc này.</div>
          </div>
          <div style={s.mascot} aria-hidden />
        </div>

        {!showInvite ? (
          <div style={{ marginTop: 12 }}>
            <button style={s.bigBtn} onClick={() => setShowInvite(true)}>Thêm người</button>
          </div>
        ) : (
          <div style={{ ...s.inviteRow, marginTop: 12 }}>
            <input
              id="inviteInput"
              style={{ ...s.txt, background: WRAP_BG, border: "1.5px solid rgba(0,0,0,.08)" }}
              placeholder="Email"
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
            />
            <button
              style={{ ...s.pillDark, opacity: emailOk(invite) ? 1 : 0.5, cursor: emailOk(invite) ? "pointer" : "not-allowed" }}
              disabled={!emailOk(invite)}
              onClick={addInvite}
            >
              Gửi
            </button>
          </div>
        )}

        {!!(invites || []).length && (
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {invites.map((em) => (
              <li key={em} style={s.inviteItem}>
                <div style={s.avatar}>{avatarText(em)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{em}</div>
                  <span style={s.badge}>Đang chờ</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={s.softBtn} onClick={copy}>Copy link</button>
                  <button
                    style={{ ...s.softBtn, color: "#b00020", borderColor: "rgba(255,0,0,.25)" }}
                    onClick={() => removeInvite(em)}
                  >
                    Gỡ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/* Styles */
const PURPLE = "#DCCAF8";
const SW_H = 32;
const SW_W = 60;
const SW_BORDER = 2;
const SW_GAP = 1;
const KNOB = SW_H - 2 * SW_GAP;
const BIAS_OFF = -2;
const BIAS_ON  =  2;

const s = {
  card: {
    background: "#111",
    color: "#fff",
    borderRadius: 16,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardSub: { opacity: 0.8, fontSize: 13, fontWeight: 500 },
  cardTitle: { fontWeight: 700, fontSize: 16, marginTop: 2 },

  switchContainer: { width: SW_W, height: SW_H, flexShrink: 0 },
  switch: {
    width: "100%",
    height: "100%",
    borderRadius: SW_H / 2,
    background: "#000",
    border: `${SW_BORDER}px solid ${PURPLE}`,
    position: "relative",
    padding: 0,
    cursor: "pointer",
    outline: "none",
  },
  knob: {
    position: "absolute",
    top: "50%",
    left: SW_GAP + BIAS_OFF,
    transform: "translateY(-50%)",
    width: KNOB,
    height: KNOB,
    borderRadius: "50%",
    background: PURPLE,
    boxShadow: "0 1px 3px rgba(0,0,0,.35)",
    transition: "left .18s ease",
  },
  knobOn: { left: `calc(100% - ${SW_GAP + KNOB - BIAS_ON}px)` },

  linkBox: { borderRadius: 12, padding: 6, display: "flex", alignItems: "center", gap: 6 },
  linkInput: {
    flex: 1, background: "transparent", border: "none", color: "#111",
    fontSize: 15, padding: "10px 10px", outline: "none",
  },
  copyButton: {
    background: "#111", color: "#fff", fontWeight: 700, borderRadius: 999,
    padding: "10px 18px", border: 0, cursor: "pointer",
  },

  infoPanel: { marginTop: 14, borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,.06)" },
  infoTitle: { fontSize: 18, fontWeight: 800 },
  infoSub: { opacity: .8, marginTop: 6 },
  mascot: { width: 56, height: 40, background: "linear-gradient(90deg,#b9a6d8,#0000)", borderRadius: 8 },

  bigBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, padding: "14px 20px", fontWeight: 900, background: "#111", color: "#fff", border: 0, cursor: "pointer" },
  inviteRow: { display: "flex", gap: 8, alignItems: "center" },

  txt: { flex: 1, minWidth: 240, border: "1.5px solid rgba(0,0,0,.08)", borderRadius: 12, padding: "12px 14px", background: "#E7E4EF", color: "#111" },
  inviteItem: { display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, background: "#fff" },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 },
  badge: { background: "#eee", borderRadius: 999, padding: "3px 8px", fontSize: 12 },
  softBtn: { borderRadius: 999, padding: "8px 12px", border: "1px solid rgba(0,0,0,.2)", background: "#fff", cursor: "pointer", fontWeight: 700 },
  pillDark: { borderRadius: 999, padding: "10px 16px", fontWeight: 900, background: "#111", color: "#fff", border: 0, cursor: "pointer" },
};
