// src/components/modals/SearchModal.jsx
import React, { useState, useEffect, useMemo } from 'react';

const PALETTE_KEY = "app_color_palette";
const DEFAULTS = [
  "transparent", "#d32f45", "#fae153", "#111111", "#cfcfcf",
  "#4662ff", "#ffaf20", "#19ff98", "#dc5dff", "#d43a54", "#ffffff"
];

function NoResults() {
    return (
        <div style={styles.noResultsContainer}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" style={{color: '#e0e0e0'}}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                <path d="M15.5 15.5L8.5 8.5" stroke="#a0a0a0" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M15.5 8.5L8.5 15.5" stroke="#a0a0a0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p style={styles.noResultsText}>Không có kết quả</p>
            <p style={styles.noResultsSubText}>Hãy thử với từ khóa khác.</p>
        </div>
    );
}

function SearchResultItem({ task, dateKey, lineIdx, onOpen }) {
    const { text, color } = task;
    const date = useMemo(() => {
        try {
            const d = new Date(dateKey);
            return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
        } catch { return ''; }
    }, [dateKey]);

    const handleClick = () => {
        onOpen?.({ dateKey, lineIdx, date: new Date(dateKey) });
    };

    return (
        <div onClick={handleClick} style={styles.resultItem}>
            {color ? (
                <span style={{...styles.chip, background: color, color: getTextColor(color)}}>{text}</span>
            ) : (
                <span>{text}</span>
            )}
            <span style={styles.resultDate}>{date}</span>
        </div>
    );
}

function getTextColor(bg) {
    if (!bg || bg === 'transparent') return '#111';
    try {
      const c = bg.replace('#', '');
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq >= 160 ? '#111' : '#fff';
    } catch {
      return '#111';
    }
}

export default function SearchModal({ tasks = {}, onClose, onOpenTask }) {
  const [query, setQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [palette, setPalette] = useState(DEFAULTS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PALETTE_KEY);
      if (saved) setPalette(JSON.parse(saved));
    } catch {}
  }, []);

  const filteredResults = useMemo(() => {
    const results = [];
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery && !selectedColor) return [];

    Object.entries(tasks).forEach(([dateKey, dayTasks]) => {
      Object.entries(dayTasks).forEach(([lineIdx, task]) => {
        if(!task || !task.text) return;

        const textMatch = lowerQuery ? (task.text || '').toLowerCase().includes(lowerQuery) : true;
     
        const colorMatch = selectedColor 
            ? (selectedColor === 'transparent' ? (task.color === '' || !task.color) : task.color === selectedColor) 
            : true;
        
        if (textMatch && colorMatch) {
          results.push({ task, dateKey, lineIdx });
        }
      });
    });

    return results;
  }, [tasks, query, selectedColor]);

  const handleOpenTask = (payload) => {
    onClose?.();
    onOpenTask?.(payload);
  }

  const isSearching = query.trim() !== '' || selectedColor !== null;
  
  const modalStyle = {
      ...styles.modal,
      paddingBottom: (isSearching && filteredResults.length === 0) ? '24px' : '25px',
  };

  return (
    <div style={styles.overlay} onMouseDown={onClose}>
      <div style={modalStyle} onMouseDown={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Tìm kiếm</h2>
        
        <div style={styles.inputWrapper}>
          <input 
            type="text" 
            style={styles.input}
            placeholder="Tìm kiếm công việc..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && <button style={styles.clearButton} onClick={() => setQuery('')}>×</button>}
        </div>
        
        <div style={styles.palette}>
          {palette.map((color, i) => (
            <button
              key={i}
              style={{
                  ...styles.swatch,
                  background: color === 'transparent' ? '#fff' : color,
                  border: color === 'transparent' ? '1px solid #ccc' : 'none'
              }}
              onClick={() => setSelectedColor(c => c === color ? null : color)}
            >
              {selectedColor === color && <span style={{...styles.check, color: getTextColor(color)}}>✓</span>}
            </button>
          ))}
        </div>

        {isSearching && (
            <div style={styles.resultsContainer}>
                {filteredResults.length > 0 ? (
                    filteredResults.map(({ task, dateKey, lineIdx }) => (
                        <SearchResultItem key={`${dateKey}-${lineIdx}`} task={task} dateKey={dateKey} lineIdx={lineIdx} onOpen={handleOpenTask} />
                    ))
                ) : (
                    <NoResults />
                )}
            </div>
        )}
      </div>
    </div>
  );
}

const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '70px', zIndex: 2000 },
    modal: { background: '#fff', borderRadius: '28px', padding: '24px', width: '515px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.2s ease-out' },
    title: { margin: 0, fontSize: '24px', fontWeight: '800' },
    inputWrapper: { position: 'relative' },
    input: { width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '12px', outline: 'none' },
    clearButton: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' },
    palette: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
    swatch: { width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    check: { fontSize: '18px', fontWeight: 'bold' },
    resultsContainer: { minHeight: '150px', maxHeight: '40vh', overflowY: 'auto', borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' },
    resultItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '8px', cursor: 'pointer' },
    resultDate: { color: '#888', fontSize: '14px' },
    chip: { padding: '2px 10px', borderRadius: '99px', fontSize: '14px', fontWeight: '500' },
    noResultsContainer: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: '20px' },
    noResultsText: { margin: '8px 0 0', fontSize: '16px', fontWeight: '600', color: '#555' },
    noResultsSubText: { margin: '0', fontSize: '14px', color: '#999' },
};