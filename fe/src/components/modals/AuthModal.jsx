// src/components/modals/AuthModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import * as API from "../../api";

const nameFromEmail = (email = "") =>
  String(email).split("@")[0]
    .split(/[._-]+/g).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
 import { API_BASE_URL } from '../../api/_fetch';
const API_BASE = API_BASE_URL;

export default function AuthModal({
  open,
  defaultMode = "login",
  onClose,
  onSuccess
}) {
  const visible = open ?? false;
  const [mode, setMode] = useState(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    if (visible) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [visible, onClose]);

  const canSubmit = useMemo(() => !!email && !!pwd && !submitting, [email, pwd, submitting]);

  const submit = async (provider = "email") => {
    if (provider === "email" && !canSubmit) return;
    try {
      setSubmitting(true);
      if (provider === "email") {
        if (mode === "signup") {
          const { token, user } = await API.auth.register({
            name: name?.trim() || nameFromEmail(email),
            email: email.trim(),
            password: pwd
          });
          onSuccess?.({ token, user });
        } else {
          const { token, user } = await API.auth.login({
            email: email.trim(),
            password: pwd
          });
          onSuccess?.({ token, user });
        }
      }
    } catch (e) {
      const msg = e?.message || e?.toString?.() || "Đăng nhập/Đăng ký thất bại.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      style={styles.overlay}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      role="dialog"
      aria-modal="true"
    >
      <div style={styles.card} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.headRow}>
          <h2 style={styles.title}>
            {mode === "login" ? "Xin chào, mừng bạn quay lại!" : "Xin chào, rất vui được gặp bạn!"}
          </h2>
          <button
            type="button"
            onClick={() => setMode(m => m === "login" ? "signup" : "login")}
            style={styles.switchBtn}
          >
            {mode === "login" ? "Đăng ký" : "Đăng nhập"}
          </button>
        </div>

        {mode === "signup" && (
          <div style={styles.inputWrap}>
            <input
              style={styles.input}
              placeholder="Tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div style={styles.inputWrap}>
          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={styles.inputWrap}>
          <input
            style={styles.input}
            placeholder="Mật khẩu"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit('email'); }}
          />
        </div>

        {mode === "login" ? (
          <div style={styles.rowBetween}>
            <span />
            <button type="button" style={styles.linkBtn}>Quên mật khẩu?</button>
          </div>
        ) : (
          <>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={subscribe}
                onChange={(e) => setSubscribe(e.target.checked)}
              />
              <span style={{ marginLeft: 10 }}>Nhận thông tin cập nhật</span>
            </label>
            <p style={styles.smallNote}>
              Bằng việc tiếp tục, bạn đồng ý với <u>Điều khoản</u> và <u>Chính sách quyền riêng tư</u>.
            </p>
          </>
        )}

        <button
          type="button"
          style={{ ...styles.primaryBtn, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed" }}
          disabled={!canSubmit}
          onClick={() => submit("email")}
        >
          {submitting ? "Đang xử lý..." : (mode === "login" ? "Đăng nhập" : "Tạo tài khoản")}
        </button>

        <div style={styles.oauthRow}>
          <a
            href={`${API_BASE}/api/auth/google`}
            style={{...styles.oauthBtn, textDecoration: 'none', color: 'inherit'}}
          >
            <span style={styles.gIcon}>G</span>
            <span>{mode === "login" ? "Đăng nhập với Google" : "Đăng ký với Google"}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 16
  },
  card: {
    width: "min(520px, 92vw)",
    borderRadius: 24,
    background: "#F6E1DB",
    border: "1px solid rgba(0,0,0,.12)",
    boxShadow: "0 28px 80px rgba(0,0,0,.30)",
    padding: 24,
    pointerEvents: "auto"
  },
  headRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: 900, margin: 0 },
  switchBtn: {
    padding: "8px 14px", borderRadius: 999,
    background: "rgba(0,0,0,.06)", border: "1px solid rgba(0,0,0,.15)",
    fontWeight: 700, cursor: "pointer"
  },
  inputWrap: { marginTop: 16, borderBottom: "2px solid rgba(0,0,0,.2)" },
  input: { width: "100%", padding: "12px 0", background: "transparent", border: "none", outline: "none", fontSize: 18 },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  linkBtn: { background: "none", border: 0, fontWeight: 700, cursor: "pointer", opacity: .7 },
  checkboxRow: { display: "flex", alignItems: "center", marginTop: 16, fontSize: 16 },
  smallNote: { fontSize: 13, opacity: .7, marginTop: 10, lineHeight: 1.5 },
  primaryBtn: { marginTop: 18, width: "100%", border: 0, borderRadius: 16, padding: "14px 16px", fontSize: 18, fontWeight: 900, background: "#111", color: "#fff" },
  oauthRow: { display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" },
  oauthBtn: { flex: "1 1 240px", minWidth: 220, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(0,0,0,.2)", background: "#fff", fontWeight: 700, cursor: "pointer" },
  gIcon: { width: 24, height: 24, lineHeight: "24px", borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F2F2F2", fontWeight: 900 }
};
