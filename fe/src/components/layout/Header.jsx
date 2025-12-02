import React, { useEffect, useMemo, useRef, useState } from "react";

/*Tạo lịch*/
function NewCalendarModal({ isOpen, onClose, onCreateCalendar }) {
  const [step, setStep] = useState("selectType");
  const [calendarType, setCalendarType] = useState(null);
  const [calendarName, setCalendarName] = useState("");
  if (!isOpen) return null;

  const handleSelectType = (type) => {
    setCalendarType(type);
    setStep("enterName");
  };

  const handleCreate = () => {
    const name = calendarName.trim();
    if (name) {
      onCreateCalendar?.({ type: calendarType, name });
      handleClose();
    } else {
      alert("Vui lòng nhập tên lịch.");
    }
  };

  const handleClose = () => {
    setStep("selectType");
    setCalendarName("");
    setCalendarType(null);
    onClose();
  };

  return (
    <div style={modalStyles.overlay} onMouseDown={handleClose}>
      <div style={modalStyles.modal} onMouseDown={(e) => e.stopPropagation()}>
        {step === "selectType" && (
          <>
            <h3 style={modalStyles.title}>Tạo lịch mới</h3>
            <p style={modalStyles.message}>Bạn muốn tạo loại lịch nào?</p>
            <div style={modalStyles.optionsContainer}>
              <button style={modalStyles.optionButton} onClick={() => handleSelectType("personal")}>
                Cá nhân
                <p style={modalStyles.optionDescription}>Lịch riêng cho bạn.</p>
              </button>
              <button style={modalStyles.optionButton} onClick={() => handleSelectType("team")}>
                Phòng ban/Nhóm
                <p style={modalStyles.optionDescription}>Lịch chia sẻ cho một nhóm nhỏ.</p>
              </button>
              <button style={modalStyles.optionButton} onClick={() => handleSelectType("company")}>
                Doanh nghiệp/Công ty
                <p style={modalStyles.optionDescription}>Lịch chung cho toàn bộ công ty.</p>
              </button>
            </div>
          </>
        )}
        {step === "enterName" && (
          <>
            <h3 style={modalStyles.title}>Lịch mới</h3>
            <p style={modalStyles.message}>Bạn muốn đặt tên lịch mới của mình là gì?</p>
            <div style={modalStyles.inputWrapper}>
              <input
                type="text"
                style={modalStyles.input}
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                placeholder="Tên lịch"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              />
            </div>
            <div style={modalStyles.actionsContainer}>
              <button onClick={handleCreate} style={modalStyles.createButton}>Tạo</button>
              <button onClick={handleClose} style={modalStyles.cancelButton}>Hủy</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function monthYearVi(d) {
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  return `Tháng ${m} / ${y}`;
}
const initialsOf = (name = "") =>
  name.trim().split(/\s+/).map(w => w[0]?.toUpperCase()).slice(0, 2).join("");

// so sánh id an toàn
const sid = (v) => (v == null ? null : String(v));

// Icons
const menuIconProps = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
const SearchIcon = () => (<svg {...menuIconProps}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const PrintIcon = () => (<svg {...menuIconProps}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>);
const ShareIcon = () => (<svg {...menuIconProps}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>);


const profileIconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" };
const CalendarIcon = () => <svg {...profileIconProps}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const SettingsIcon = () => <svg {...profileIconProps}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const LogoutIcon = () => <svg {...profileIconProps}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 5 12"></polyline></svg>;

export default function Header({
  viewDate,
  onPrevWeek,
  onNextWeek,
  onOpenSearch,
  user,
  onUserClick,
  onLogout,
  onOpenCalendarSettings,
  onOpenAccount,
  onCreateCalendar,
  calendars,
  activeCalendar,
  onSwitchCalendar,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [isNewCalendarModalOpen, setIsNewCalendarModalOpen] = useState(false);

  const computedTitle = monthYearVi(viewDate instanceof Date ? viewDate : new Date());
  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    const view = viewDate instanceof Date ? viewDate : new Date();
    return today.getFullYear() === view.getFullYear() && today.getMonth() === view.getMonth();
  }, [viewDate]);
  const titleStyle = { color: isCurrentMonth ? '#504eccff' : 'inherit', transition: 'color 0.3s ease-in-out' };

  // chỉ "ready" khi đã có user + calendars + activeCalendar
  const calendarsReady =
    !!user &&
    Array.isArray(calendars) &&
    calendars.length > 0 &&
    !!activeCalendar;

  // nhận biết lịch mặc định: đọc cả isDefault & is_default
  const isDefaultCal = !!(activeCalendar && (activeCalendar.isDefault ?? activeCalendar.is_default));

  // badge initials/label: chỉ tính khi ready
  const headerBadgeInitials = useMemo(() => {
    if (!calendarsReady) return "";
    return isDefaultCal
      ? initialsOf(user?.name || user?.email || "")
      : initialsOf(activeCalendar?.name || "");
  }, [calendarsReady, isDefaultCal, activeCalendar, user]);

  const headerBadgeLabel = useMemo(() => {
    if (!calendarsReady) return user?.name || user?.email || "Đăng nhập";
    return isDefaultCal
      ? (user?.name || user?.email)
      : (activeCalendar?.name || "");
  }, [calendarsReady, isDefaultCal, activeCalendar, user]);

  const accountInitials = initialsOf(user?.name || user?.email || "");
  const displayCalName = (cal) =>
    (cal?.isDefault ?? cal?.is_default) ? "Lịch của tôi" : (cal?.name || "");

  useEffect(() => {
    const onDown = (e) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    const onEsc = (e) => { if (e.key === "Escape") { setIsMenuOpen(false); setIsProfileOpen(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isMenuOpen, isProfileOpen]);

  useEffect(() => {
    // Khóa nền CHỈ khi mở modal "Tạo lịch" (có overlay).
    document.body.classList.toggle('modal-open', !!isNewCalendarModalOpen);
    return () => document.body.classList.remove('modal-open');
  }, [isNewCalendarModalOpen]);

  const handleOpenNewCalendar = () => {
    setIsProfileOpen(false);
    setIsNewCalendarModalOpen(true);
  };

  const activeCalDisplay = activeCalendar ? displayCalName(activeCalendar) : "Lịch của tôi";

  // danh sách lịch khác: so sánh String(id) & chỉ khi ready
  const otherCalendars = calendarsReady
    ? (calendars || []).filter(c => sid(c.id) !== sid(activeCalendar.id))
    : [];

  return (
    <>
      <header className="header">
        <h1 className="h1" style={titleStyle}>{computedTitle}</h1>

        <div className="header-right">
          {/* Badge đầu trang */}
          <div style={{ position: "relative" }} ref={profileRef}>
            <button
              className="badge-circle soft"
              aria-label={headerBadgeLabel}
              onClick={() => { if (!user) { onUserClick?.(); return; } setIsProfileOpen(v => !v); }}
              title={headerBadgeLabel}
            >
              {user ? (
                <span style={{ display: "inline-flex", width: 20, height: 20, alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                  {headerBadgeInitials}
                </span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>

            {/* Panel hồ sơ */}
            {isProfileOpen && user && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  zIndex: 2000,
                  minWidth: 320,
                  maxHeight: "80vh",
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.12)",
                  borderRadius: 12,
                  boxShadow: "0 10px 30px rgba(0,0,0,.18)",
                }}
              >
                {/* Avatar + tên TÀI KHOẢN */}
                <div style={{ padding: 16, textAlign: "center" }}>
                  <div style={{
                    width: 66, height: 66, borderRadius: "50%",
                    border: "1px solid rgba(0,0,0,.2)", background: "#fff",
                    display: "grid", placeItems: "center", fontWeight: 900,
                    margin: "0 auto 10px"
                  }}>
                    {accountInitials}
                  </div>
                  <div style={{ fontWeight: 800 }}>{user.name || user.email}</div>
                </div>

                <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900 }}>
                    <CalendarIcon /> {activeCalDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsProfileOpen(false); onOpenCalendarSettings?.(); }}
                    style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 999, border: 0, background: "#e7dcff", fontWeight: 800, cursor: "pointer" }}
                  >
                    Cài đặt
                  </button>
                </div>

                <div style={{ borderTop: "1px solid rgba(0,0,0,.08)" }} />

                {/* chỉ render danh sách khi calendarsReady để tránh nhân đôi */}
                {calendarsReady && otherCalendars.length > 0 && (
                  <div style={{ padding: "6px 8px" }}>
                    {otherCalendars.map(cal => (
                      <button
                        key={cal.id}
                        style={{ ...menuItemStyle, padding: '12px 12px', width: '100%' }}
                        onClick={() => { onSwitchCalendar(cal.id); setIsProfileOpen(false); }}
                        title={displayCalName(cal)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800 }}>
                          <CalendarIcon /> {displayCalName(cal)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tạo lịch mới */}
                <div style={{ padding: 16 }}>
                  <button
                    type="button"
                    style={{ width: "100%", borderRadius: 999, padding: "14px 18px", border: 0, fontWeight: 900, background: "#111", color: "#fff", cursor: "pointer" }}
                    onClick={handleOpenNewCalendar}
                  >
                    Tạo lịch mới
                  </button>
                </div>

                {/* Footer */}
                <div style={{ borderTop: "1px solid rgba(0,0,0,.08)", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button type="button" style={profileMenuItemStyle} onClick={() => { setIsProfileOpen(false); onOpenAccount?.(); }}>
                    <SettingsIcon /> Tài khoản
                  </button>
                  <button type="button" style={profileMenuItemStyle} onClick={() => { setIsProfileOpen(false); onLogout?.(); }}>
                    <LogoutIcon /> Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menu 3 chấm */}
          <div className="dropdown" ref={menuRef} style={{ position: "relative" }}>
            <button className="badge-circle soft purple" aria-label="Menu" onClick={() => setIsMenuOpen(v => !v)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="6" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="18" r="1" />
              </svg>
            </button>

            {isMenuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 1500,
                background: "#fff", border: "1px solid rgba(0,0,0,.12)", borderRadius: 12,
                overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.18)", minWidth: 220, padding: 6
              }}>
                <button className="menu-item" onClick={() => { onOpenSearch?.(); setIsMenuOpen(false); }} style={menuItemStyle}>
                  <span>Tìm kiếm</span><SearchIcon />
                </button>
                <button className="menu-item" style={menuItemStyle} onClick={() => { setIsMenuOpen(false); window.print(); }}>
                  <span>In</span><PrintIcon />
                </button>
                <button className="menu-item" style={menuItemStyle} onClick={() => { setIsMenuOpen(false); onOpenCalendarSettings?.(); }}>
                  <span>Chia sẻ</span><ShareIcon />
                </button>
              </div>
            )}
          </div>

          {/* Điều hướng tuần */}
          <button className="badge-circle dark" onClick={onPrevWeek} aria-label="Tuần trước">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="badge-circle dark" onClick={onNextWeek} aria-label="Tuần sau">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Modal tạo lịch */}
      <NewCalendarModal
        isOpen={isNewCalendarModalOpen}
        onClose={() => setIsNewCalendarModalOpen(false)}
        onCreateCalendar={onCreateCalendar}
      />
    </>
  );
}

/* Styles  */
const menuItemStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  width: "100%", textAlign: "left", padding: "10px 14px",
  background: "transparent", border: "none", cursor: "pointer",
  fontWeight: 500, fontSize: 16, borderRadius: 6,
};
const profileMenuItemStyle = { ...menuItemStyle, width: 'auto', padding: '8px 12px' };

/* Styles cho Modal tạo lịch */
const modalStyles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000,
  },
  modal: {
    width: "515px", borderRadius: 28, background: "#E9DDFC",
    border: "1px solid rgba(0,0,0,.12)", boxShadow: "0 24px 80px rgba(0,0,0,.35)",
    padding: "32px", textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px',
  },
  title: { margin: 0, fontSize: '24px', fontWeight: '900', color: '#111' },
  message: { margin: 0, fontSize: '16px', lineHeight: 1.6, color: '#333', opacity: 0.8 },
  optionsContainer: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' },
  optionButton: {
    padding: '15px 20px', borderRadius: '16px', background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
    textAlign: 'left', cursor: 'pointer', fontSize: '16px', fontWeight: '700', color: '#333',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  },
  optionDescription: { fontSize: '13px', fontWeight: 'normal', color: '#666', margin: '4px 0 0', lineHeight: 1.4 },
  inputWrapper: { marginTop: '10px', marginBottom: '10px' },
  input: {
    width: '100%', padding: '14px 18px', fontSize: '16px',
    border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '16px', background: '#fff', outline: 'none',
  },
  actionsContainer: { display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px' },
  createButton: {
    padding: '14px 28px', borderRadius: '16px', background: '#111', color: '#fff',
    border: 'none', fontSize: '17px', fontWeight: '700', cursor: 'pointer', minWidth: '120px',
  },
  cancelButton: {
    padding: '14px 28px', borderRadius: '16px', background: '#fff', color: '#333',
    border: '1px solid rgba(0,0,0,.15)', fontSize: '17px', fontWeight: '700', cursor: 'pointer', minWidth: '120px',
  },
};
