// fe/src/components/notes/InlineNote.jsx
import React, { useState, useRef, useEffect } from 'react';

export default function InlineNote({ 
  note, 
  onSave, 
  onDelete, 
  onFocus,
  autoFocus = false 
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [lastSaved, setLastSaved] = useState(Date.now());
  
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const noteRef = useRef(null);

  useEffect(() => {
    if (autoFocus && titleRef.current) {
      titleRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    // Auto-save after user stops typing for 2 seconds
    if (isDirty) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, title, content]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (noteRef.current && !noteRef.current.contains(event.target)) {
        handleBlur();
      }
    };

    if (isFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFocused]);

  const handleSave = async () => {
    if (!isDirty) return;

    try {
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();

      console.log('[InlineNote] Saving note:', {
        noteId: note?.id,
        title: trimmedTitle,
        content: trimmedContent
      });

      // Only save if there's actual content
      if (trimmedTitle || trimmedContent) {
        const noteData = {
          title: trimmedTitle,
          content: trimmedContent,
          color: note?.color || '#ffffff',
          is_pinned: note?.is_pinned || false,
          is_archived: note?.is_archived || false,
          tags: note?.tags || []
        };

        if (note?.id) {
          // Update existing note
          console.log('[InlineNote] Updating existing note with ID:', note.id);
          await onSave(note.id, noteData);
        } else {
          // Create new note
          console.log('[InlineNote] Creating new note');
          await onSave(noteData);
        }

        setIsDirty(false);
        setLastSaved(Date.now());
        console.log('[InlineNote] Note saved successfully');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      // Don't reset isDirty on error so user can retry
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (isDirty) {
      handleSave();
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target === titleRef.current) {
      // Move to content when pressing Enter in title
      e.preventDefault();
      contentRef.current?.focus();
    } else if (e.key === 'Escape') {
      // Blur on Escape
      e.target.blur();
    }
  };

  const handleDelete = async () => {
    if (note?.id && onDelete) {
      await onDelete(note.id);
    }
  };

  const isEmpty = !title.trim() && !content.trim();
  const isNewNote = !note?.id;

  return (
    <div 
      ref={noteRef}
      className={`inline-note ${isFocused ? 'focused' : ''} ${isEmpty ? 'empty' : ''}`}
      style={{ backgroundColor: note?.color || '#ffffff' }}
    >
      {/* Note content */}
      <div className="note-inputs">
        <input
          ref={titleRef}
          type="text"
          placeholder={isFocused ? "Tiêu đề" : "Tạo ghi chú..."}
          value={title}
          onChange={handleTitleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="note-title-inline"
        />
        
        {(isFocused || content) && (
          <textarea
            ref={contentRef}
            placeholder="Viết ghi chú..."
            value={content}
            onChange={handleContentChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="note-content-inline"
            rows="3"
          />
        )}
      </div>

      {/* Actions (only show when focused or has content) */}
      {(isFocused || !isEmpty) && (
        <div className="note-actions-inline">
          {isDirty && (
            <span className="save-status">
              Đang lưu...
            </span>
          )}
          
          {!isDirty && !isNewNote && (
            <span className="save-status saved">
              ✓ Đã lưu
            </span>
          )}
          
          {!isNewNote && (
            <button 
              type="button"
              onClick={handleDelete}
              className="action-btn delete-btn"
              title="Xóa ghi chú"
            >
              🗑️
            </button>
          )}
          
          <button 
            type="button"
            onClick={handleBlur}
            className="action-btn close-btn"
            title="Đóng"
          >
            ✓ Xong
          </button>
        </div>
      )}

      {/* Pin indicator */}
      {note?.is_pinned && (
        <div className="pin-indicator">
          📌
        </div>
      )}
    </div>
  );
}
