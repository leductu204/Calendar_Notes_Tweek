// src/components/modals/AccountModal.jsx
import React, { useState, useEffect, useRef } from "react";
const emailOk = (s) => /\S+@\S+\.\S+/.test((s || "").trim());
const avatarText = (email) => (email || "?").trim()[0]?.toUpperCase() || "U";

function MemberRow({ email, onRemove }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://example.com/invite?email=${email}`);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      setIsMenuOpen(false);
    }, 2000); 
  };

  return (
    <div style={styles.memberRow}>
      <div style={styles.memberAvatar}>{avatarText(email)}</div>
      <div style={{ flex: 1, lineHeight: 1.3 }}>
        <div style={{ fontWeight: 700 }}>{email}</div>
        <span style={styles.pendingBadge}>Đang chờ</span>
      </div>
      <div style={{ position: 'relative' }} ref={menuRef}>
        <button onClick={() => setIsMenuOpen(v => !v)} style={styles.menuToggle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {isMenuOpen && (
          <div style={styles.dropdownMenu}>
            <button onClick={handleCopyLink} style={styles.menuItem}>
              <span style={{flex: 1, textAlign: 'left'}}>{isCopied ? 'Đã sao chép' : 'Sao chép liên kết'}</span>
              {isCopied && <span style={{color: '#22c55e'}}>✓</span>}
            </button>
            <button onClick={() => onRemove(email)} style={{...styles.menuItem, ...styles.menuItemDanger}}>
              Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({ onClose, onConfirm }) {
    return (
        <div style={styles.confirmOverlay} onMouseDown={onClose}>
            <div style={styles.confirmModal} onMouseDown={(e) => e.stopPropagation()}>
                <h3 style={styles.confirmTitle}>Xóa tài khoản</h3>
                <p style={styles.confirmMessage}>
                    Một khi tài khoản của bạn bị xóa, bạn sẽ không còn bị tính phí và chúng tôi sẽ đảm bảo tất cả dữ liệu của bạn được xóa an toàn khỏi máy chủ của chúng tôi. Hành động này không thể hoàn tác và bạn sẽ không thể truy cập dữ liệu tài khoản của mình ngay sau khi xóa.
                </p>
                <div style={styles.confirmActionsContainer}>
                    <button onClick={onConfirm} style={styles.confirmButtonYes}>
                        Vâng, xóa tài khoản
                    </button>
                    <button onClick={onClose} style={styles.confirmButtonNo}>
                        Không, tôi đổi ý
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AccountModal({ open, onClose, user, onUpdateUser, onConfirmDelete }) {
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  
  const [invites, setInvites] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(user?.name || "");
      setPassword("");
      setRepeatPassword("");
      setShowInvite(false);
      setInviteEmail("");
      setInviteError("");
      document.body.style.overflow = 'hidden';
      try {
        const savedInvites = JSON.parse(localStorage.getItem("calendar.invites") || "[]");
        setInvites(savedInvites);
      } catch {}
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open, user]);
  
  const saveInvites = (nextInvites) => {
    setInvites(nextInvites);
    localStorage.setItem("calendar.invites", JSON.stringify(nextInvites));
  };
  
  const handleAddInvite = () => {
    const email = inviteEmail.trim();
    if (!emailOk(email)) {
      setInviteError("Vui lòng nhập một địa chỉ email hợp lệ.");
      return;
    }
    if (invites.includes(email) || email === user?.email) {
      setInviteError("Email này đã được mời.");
      return;
    }
    const next = [...invites, email];
    saveInvites(next);
    setInviteEmail("");
    setShowInvite(false);
    setInviteError("");
  };
  
  const handleRemoveInvite = (emailToRemove) => {
    const next = invites.filter((em) => em !== emailToRemove);
    saveInvites(next);
  };

  const handleSave = () => {
    if (password && password !== repeatPassword) {
      alert("Mật khẩu không khớp!");
      return;
    }
    onUpdateUser?.({ ...user, name: name.trim() });
    onClose();
  };

  const handleConfirmDeletion = () => {
      onConfirmDelete?.(); 
      setIsConfirmingDelete(false); 
  };
  
  if (!open) return null;

  return (
    <>
      <div style={styles.overlay} onMouseDown={onClose}>
        <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
          <div style={{ padding: '0 24px' }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: '24px' }}>
                <h2 style={{ margin: 0, fontWeight: 900, fontSize: 24 }}>Tài khoản</h2>
                <button onClick={onClose} style={styles.closeButton} aria-label="Đóng">×</button>
              </div>

              <section style={{ marginTop: 24 }}>
                  <div style={styles.inputWrapper}>
                      <label style={styles.label}>Tên của bạn</label>
                      <input type="text" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên của bạn"/>
                  </div>
                  <div style={styles.inputWrapper}>
                      <label style={styles.label}>Email</label>
                      <input type="email" style={styles.input} value={user?.email || ''} disabled/>
                  </div>
                   <div style={styles.inputWrapper}>
                      <label style={styles.label}>Mật khẩu</label>
                      <input type="password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Để trống nếu không đổi"/>
                  </div>
                   <div style={styles.inputWrapper}>
                      <label style={styles.label}>Nhập lại mật khẩu</label>
                      <input type="password" style={styles.input} value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} placeholder="Để trống nếu không đổi"/>
                  </div>
              </section>

              <section style={{ marginTop: 28 }}>
                  <h3 style={styles.sectionTitle}>Thành viên của bạn</h3>
                  {invites.map((email) => (
                      <MemberRow key={email} email={email} onRemove={handleRemoveInvite} />
                  ))}
                  
                  {showInvite ? (
                      <div style={{marginTop: '12px'}}>
                        <div style={styles.inviteBox}>
                            <input
                                style={styles.inviteInput}
                                placeholder=""
                                value={inviteEmail}
                                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                                autoFocus
                            />
                            <button style={styles.inviteButton} onClick={handleAddInvite}>
                                Mời
                            </button>
                        </div>
                        {inviteError && <p style={styles.errorMessage}>{inviteError}</p>}
                      </div>
                  ) : (
                      <button type="button" style={styles.addButton} onClick={() => setShowInvite(true)}>
                          Thêm người
                      </button>
                  )}
              </section>
          </div>

          <div style={styles.actionsContainer}>
               <button onClick={handleSave} style={styles.primaryButton}>
                  Lưu thay đổi
              </button>
              <button onClick={() => setIsConfirmingDelete(true)} style={styles.deleteButton}>
                  Xóa tài khoản
              </button>
          </div>
        </div>
      </div>
      
      {isConfirmingDelete && (
          <ConfirmDeleteDialog
              onClose={() => setIsConfirmingDelete(false)}
              onConfirm={handleConfirmDeletion}
          />
      )}
    </>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999, overflowY: 'auto' },
  modal: { width: "515px", borderRadius: 28, background: "#E9DDFC", border: "1px solid rgba(0,0,0,.12)", boxShadow: "0 24px 80px rgba(0,0,0,.35)", margin: '70px auto 30px' },
  closeButton: { marginLeft: "auto", border: 0, background: "transparent", fontWeight: 800, fontSize: 22, cursor: "pointer" },
  inputWrapper: { marginBottom: '16px' },
  label: { fontWeight: 700, fontSize: '14px', marginBottom: '8px', display: 'block', color: 'rgba(0,0,0,0.7)' },
  input: { width: '100%', padding: '12px 14px', fontSize: '16px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '12px', background: 'rgba(255,255,255,0.5)', outline: 'none' },
  actionsContainer: { marginTop: '24px', borderTop: '1px solid rgba(0,0,0,.1)', padding: '20px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  primaryButton: { padding: '12px 20px', borderRadius: '12px', background: '#111', color: '#fff', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer' },
  deleteButton: { padding: '12px', borderRadius: '12px', background: 'transparent', color: '#c53030', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' },
  sectionTitle: { fontWeight: 900, fontSize: '18px', marginBottom: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '20px' },
  memberRow: { display: "flex", alignItems: "center", gap: 12, padding: "8px", background: 'rgba(255,255,255,0.4)', borderRadius: '12px', marginBottom: '8px' },
  memberAvatar: { width: 42, height: 42, borderRadius: "50%", border: "1px solid rgba(0,0,0,.1)", background: "#fff", display: "grid", placeItems: "center", fontWeight: 900, flexShrink: 0 },
  pendingBadge: { background: '#fefcbf', color: '#92400e', padding: '2px 8px', borderRadius: '99px', fontSize: '12px', fontWeight: '600' },
  addButton: { width: '100%', padding: '12px', borderRadius: '99px', border: '1.5px solid rgba(0,0,0,0.2)', background: 'transparent', fontWeight: '700', cursor: 'pointer', marginTop: '8px', fontSize: '16px' },
  inviteBox: { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', padding: '6px' },
  inviteInput: { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', padding: '0 10px' },
  inviteButton: { padding: '10px 20px', borderRadius: '8px', background: '#333', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' },
  errorMessage: { color: '#ef4444', fontSize: '14px', marginTop: '8px', textAlign: 'left', paddingLeft: '4px' },
  menuToggle: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.7 },
  dropdownMenu: { position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '180px', padding: '4px', border: '1px solid #eee' },
  menuItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '15px' },
  menuItemDanger: { color: '#ef4444' },
 
  confirmOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
  },
  confirmModal: {
    width: "min(600px, 90vw)",
    borderRadius: 28,
    background: "#F2E8E8",
    border: "1px solid rgba(0,0,0,.12)",
    boxShadow: "0 24px 80px rgba(0,0,0,.35)",
    padding: "32px",
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  confirmTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '900',
    color: '#111',
  },
  confirmMessage: {
    margin: 0,
    fontSize: '16px',
    lineHeight: 1.6,
    color: '#333',
    opacity: 0.8,
  },
  confirmActionsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '12px',
  },
  confirmButtonYes: {
    padding: '14px 28px',
    borderRadius: '16px',
    background: '#E0656E',
    color: '#fff',
    border: 'none',
    fontSize: '17px',
    fontWeight: '700',
    cursor: 'pointer',
    minWidth: '150px',
    boxShadow: '0 4px 12px rgba(224, 101, 110, 0.3)',
  },
  confirmButtonNo: {
    padding: '14px 28px',
    borderRadius: '16px',
    background: '#fff',
    color: '#333',
    border: '1px solid rgba(0,0,0,.15)',
    fontSize: '17px',
    fontWeight: '700',
    cursor: 'pointer',
    minWidth: '150px',
  },
};