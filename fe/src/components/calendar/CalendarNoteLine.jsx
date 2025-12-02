import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as notesApi from '../../api/notes';

export default function CalendarNoteLine({
  date,
  lineIdx,
  existingNote,
  onNoteChange,
  onOpenNote,
  inputRef,
  onRequestFocus
}) {
  const [text, setText] = useState(existingNote?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Sync text with existingNote when it changes (e.g. from modal edit)
  useEffect(() => {
    setText(existingNote?.content || '');
  }, [existingNote]);

  const saveNow = useCallback(async () => {
    if (!text.trim() && !existingNote) return; // Nothing to save
    if (text === (existingNote?.content || '')) return; // No change

    setIsSaving(true);
    try {
      let savedNote;
      if (existingNote) {
        if (!text.trim()) {
           // Delete if empty
           await notesApi.deleteNote(existingNote.id);
           onNoteChange?.(lineIdx, null);
        } else {
           // Update
           savedNote = await notesApi.updateNote(existingNote.id, {
            content: text.trim(),
            title: '',
            updated_at: new Date().toISOString()
          });
          onNoteChange?.(lineIdx, savedNote);
        }
      } else if (text.trim()) {
        // Create
        const dateStr = date.toISOString().split('T')[0];
        savedNote = await notesApi.createNote({
          title: `${dateStr} - Line ${lineIdx + 1}`,
          content: text.trim(),
          tags: [`calendar-${dateStr}`, `line-${lineIdx}`],
          color: '#ffffff',
          is_pinned: false,
          is_archived: false
        });
        onNoteChange?.(lineIdx, savedNote);
      }
    } catch (error) {
      console.error('Error saving calendar note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [text, existingNote, date, lineIdx, onNoteChange]);

  // Auto-save when text changes (with debounce)
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    // Only debounce if focused, otherwise we might want immediate save? 
    // Actually, we want debounce while typing.
    if (text !== (existingNote?.content || '')) {
       setIsSaving(true); // Show indicator
       saveTimeoutRef.current = setTimeout(() => {
         saveNow();
       }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [text, existingNote, saveNow]);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onRequestFocus?.(lineIdx);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveNow(); // Save immediately on blur
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur(); // Will trigger handleBlur -> saveNow
    }
  };

  // Toggle completion status
  const handleToggleComplete = async (e) => {
    e.stopPropagation(); // Prevent opening the note modal
    if (!existingNote) return;

    const newStatus = !existingNote.is_completed;

    // Optimistic update
    onNoteChange?.(lineIdx, { ...existingNote, is_completed: newStatus });

    try {
      await notesApi.updateNote(existingNote.id, {
        is_completed: newStatus,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating note status:', error);
      // Revert on error
      onNoteChange?.(lineIdx, { ...existingNote, is_completed: !newStatus });
    }
  };

  // If there's an existing note, render as button with toggle
  if (existingNote && existingNote.content?.trim()) {
    return (
      <div
        className="line calendar-note-line"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <button
          className="calendar-note-button"
          data-color={existingNote.color}
          onClick={() => onOpenNote?.(existingNote)}
          style={{
            flex: 1,
            textAlign: 'left',
            padding: '8px 12px',
            background: existingNote.color && existingNote.color.startsWith('#') ? existingNote.color : 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textDecoration: existingNote.is_completed ? 'line-through' : 'none',
            opacity: existingNote.is_completed ? 0.6 : 1,
            borderRadius: '999px' // Ensure pill shape
          }}
          title={String(existingNote.content).replace(/<[^>]*>/g, '')}
        >
          {String(existingNote.content).replace(/<[^>]*>/g, '')}
        </button>

        <button
          className="note-toggle-btn"
          onClick={handleToggleComplete}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: existingNote.is_completed ? '#22c55e' : '#9ca3af',
            transition: 'color 0.2s'
          }}
          title={existingNote.is_completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {existingNote.is_completed ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="16 11 13 14 9 11" opacity="0"></polyline> {/* Hidden check for spacing/hint if needed, or just circle */}
            </svg>
          )}
        </button>
      </div>
    );
  }

  // Otherwise, render as input
  return (
    <div
      className="line calendar-note-line"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <input
        ref={inputRef}
        className="calendar-task-input calendar-note-input"
        value={text}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={isFocused ? "Nhập ghi chú..." : ""}
        style={{
          width: '100%',
          background: isFocused ? 'var(--hover)' : 'transparent',
          color: text.trim() ? 'var(--text)' : 'inherit'
        }}
      />

      {isSaving && (
        <div
          style={{
            position: 'absolute',
            right: '8px',
            fontSize: '12px',
            color: '#888',
            pointerEvents: 'none'
          }}
        >
          💾
        </div>
      )}
    </div>
  );
}
