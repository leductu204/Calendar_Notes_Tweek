// FE: fe/src/components/modals/AuthModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../api/_fetch";
import { loginWithEmailPassword, registerWithEmailPassword } from "../../api/auth";

const nameFromEmail = (email = "") =>
  String(email).split("@")[0]
    .split(/[._-]+/g).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

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
          const { token, user } = await registerWithEmailPassword(
            name?.trim() || nameFromEmail(email),
            email.trim(),
            pwd
          );
          onSuccess?.({ token, user });
        } else {
          const { token, user } = await loginWithEmailPassword(
            email.trim(),
            pwd
          );
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
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p style={styles.subtitle}>
          {mode === "login" 
            ? "Chào mừng bạn quay lại! Vui lòng đăng nhập để tiếp tục." 
            : "Tạo tài khoản mới để bắt đầu sử dụng."}
        </p>

        {/* Form */}
        {mode === "signup" && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tên</label>
            <input
              style={styles.input}
              placeholder="Nhập tên của bạn"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            placeholder="example@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Mật khẩu</label>
          <input
            style={styles.input}
            placeholder="Nhập mật khẩu"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit('email'); }}
          />
        </div>

        {mode === "login" && (
          <div style={styles.forgotRow}>
            <button type="button" style={styles.forgotBtn}>Quên mật khẩu?</button>
          </div>
        )}

        {mode === "signup" && (
          <>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={subscribe}
                onChange={(e) => setSubscribe(e.target.checked)}
                style={styles.checkbox}
              />
              <span>Nhận thông tin cập nhật qua email</span>
            </label>
            <p style={styles.terms}>
              Bằng việc đăng ký, bạn đồng ý với <a href="#" style={styles.link}>Điều khoản dịch vụ</a> và <a href="#" style={styles.link}>Chính sách bảo mật</a>.
            </p>
          </>
        )}

        <button
          type="button"
          style={{ 
            ...styles.primaryBtn, 
            opacity: canSubmit ? 1 : 0.6, 
            cursor: canSubmit ? "pointer" : "not-allowed" 
          }}
          disabled={!canSubmit}
          onClick={() => submit("email")}
        >
          {submitting ? "Đang xử lý..." : (mode === "login" ? "Đăng nhập" : "Tạo tài khoản")}
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerText}>hoặc</span>
        </div>

        {/* OAuth - Disabled for now */}
        {/* Uncomment when Google OAuth is configured */}
        {/*
        <a
          href={`${API_BASE}/api/auth/google`}
          style={styles.googleBtn}
        >
          <svg style={styles.googleIcon} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{mode === "login" ? "Đăng nhập với Google" : "Đăng ký với Google"}</span>
        </a>
        */}

        {/* Switch mode */}
        <div style={styles.switchRow}>
          <span style={styles.switchText}>
            {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
          </span>
          <button
            type="button"
            onClick={() => setMode(m => m === "login" ? "signup" : "login")}
            style={styles.switchLink}
          >
            {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
    animation: "fadeIn 0.2s ease-out"
  },
  card: {
    width: "min(440px, 95vw)",
    borderRadius: 20,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    padding: 40,
    position: "relative",
    animation: "slideUp 0.3s ease-out"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    margin: 0,
    color: "#fff",
    letterSpacing: "-0.5px"
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 20,
    color: "#fff",
    transition: "all 0.2s",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.3)"
    }
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    margin: "0 0 24px 0",
    lineHeight: 1.5
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    marginBottom: 8,
    letterSpacing: "0.3px"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255, 255, 255, 0.95)",
    border: "2px solid transparent",
    borderRadius: 12,
    outline: "none",
    fontSize: 15,
    transition: "all 0.2s",
    boxSizing: "border-box",
    "&:focus": {
      background: "#fff",
      borderColor: "#fff"
    }
  },
  forgotRow: {
    textAlign: "right",
    marginBottom: 20
  },
  forgotBtn: {
    background: "none",
    border: "none",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    fontSize: 14,
    color: "#fff",
    cursor: "pointer"
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer"
  },
  terms: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 1.6,
    marginBottom: 24
  },
  link: {
    color: "#fff",
    fontWeight: 600,
    textDecoration: "underline"
  },
  primaryBtn: {
    width: "100%",
    padding: "16px",
    background: "#fff",
    color: "#667eea",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)"
    }
  },
  divider: {
    position: "relative",
    textAlign: "center",
    margin: "24px 0",
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: 1,
      background: "rgba(255, 255, 255, 0.3)"
    }
  },
  dividerText: {
    position: "relative",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "0 12px",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: 600
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    padding: "14px",
    background: "#fff",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    color: "#333",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.95)"
    }
  },
  googleIcon: {
    width: 20,
    height: 20
  },
  switchRow: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
    color: "#fff"
  },
  switchText: {
    marginRight: 6,
    opacity: 0.9
  },
  switchLink: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0
  }
};
