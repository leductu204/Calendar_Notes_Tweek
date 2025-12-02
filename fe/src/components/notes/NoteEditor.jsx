import React, { useState, useRef, useEffect } from 'react';

const colors = [
  'rose',      // Pink/Red
  'orange',    // Orange
  'yellow',    // Yellow
  'lime',      // Light Green
  'green',     // Green
  'teal',      // Teal/Cyan
  'blue',      // Blue
  'indigo',    // Indigo
  'violet',    // Purple/Violet
  'pink',      // Hot Pink
  'slate',     // Gray
  'brown',     // Brown
  'red',       // Red
  'amber',     // Amber
  'emerald',   // Emerald
  'cyan',      // Cyan
  'sky',       // Sky Blue
  'purple',    // Purple
  'fuchsia',   // Fuchsia
  'gray'       // Gray
];

// Icons
const Icons = {
  Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Delete: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Refresh: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  More: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Paperclip: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>,
  Bold: () => <span style={{ fontWeight: 'bold', fontSize: '16px' }}>B</span>,
  Heading: () => <span style={{ fontWeight: 'bold', fontSize: '16px' }}>H</span>,
  List: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
  Align: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>,
  Link: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
};

export default function NoteEditor({
  note,
  onSave,
  onClose,
  onDelete,
  isSomeday // New prop to distinguish context
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [subtasks, setSubtasks] = useState(() => {
    if (Array.isArray(note?.subtasks)) return note.subtasks;
    if (typeof note?.subtasks === 'string') {
      try {
        return JSON.parse(note.subtasks);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [newSubtask, setNewSubtask] = useState('');
  
  // Extra Notes state
  const [extraNotes, setExtraNotes] = useState(note?.extra_notes || '');
  const extraNotesRef = useRef(null);
  
  const contentRef = useRef(null);
  const isNewNote = !note?.id;
  const isUserInput = useRef(false);

  useEffect(() => {
    if (contentRef.current && !content) {
      // contentRef.current.focus(); // Don't auto-focus main content to allow clicking extra notes? 
      // Actually, keep it for now.
    }
    // Sync extra notes to DOM
    if (extraNotesRef.current && extraNotes !== extraNotesRef.current.innerHTML) {
      extraNotesRef.current.innerHTML = extraNotes;
    }
  }, []);

  // Sync content to DOM only when it changes externally (not from user input)
  useEffect(() => {
    if (contentRef.current && content !== contentRef.current.innerHTML && !isUserInput.current) {
      contentRef.current.innerHTML = content;
    }
    isUserInput.current = false;
  }, [content]);

  const handleColorSelect = async (selectedColor) => {
    setColor(selectedColor);
    setShowColorPicker(false);
    if (!isNewNote && note.id) {
      try {
        await onSave({ color: selectedColor });
      } catch (error) {
        console.error('Failed to update color:', error);
      }
    }
  };

  const handleSave = async () => {
    const noteData = {
      title: title.trim(),
      content: content.trim(),
      color,
      subtasks, // Include subtasks in save
      extra_notes: extraNotes // Include extra notes in save
    };

    console.log('[NoteEditor] Saving with data:', noteData);

    // Don't save if there's no content at all
    if (!noteData.title && !noteData.content && subtasks.length === 0 && !noteData.extra_notes) {
      onClose();
      return;
    }

    try {
      await onSave(noteData);
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc muốn xóa ghi chú này?')) {
      onDelete(note.id);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };



  const handleAddSubtask = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && newSubtask.trim()) {
      const newTask = {
        id: Date.now(),
        text: newSubtask.trim(),
        completed: false
      };
      // Add new task to top of incomplete list (or just top)
      const updatedSubtasks = [...subtasks, newTask];
      // Sort: Incomplete first, then Completed
      updatedSubtasks.sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);
      
      setSubtasks(updatedSubtasks);
      setNewSubtask('');
    }
  };

  const handleToggleSubtask = (id) => {
    const updatedSubtasks = subtasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    // Sort: Incomplete first, then Completed
    updatedSubtasks.sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);
    setSubtasks(updatedSubtasks);
  };

  const handleDeleteSubtask = (id) => {
    setSubtasks(subtasks.filter(task => task.id !== id));
  };

  // Extract date from title (format: "2025-11-26 - Line 1") or use updated_at
  const getDisplayDate = () => {
    if (note?.title) {
      const dateMatch = note.title.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const [year, month, day] = dateMatch[1].split('-');
        const noteDate = new Date(year, month - 1, day);
        return noteDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    // Fallback to updated_at or current date
    return note?.updated_at
      ? new Date(note.updated_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formattedDate = getDisplayDate();

  return (
    <div className="note-editor-overlay" onClick={handleSave}>
      <div
        className="note-editor-optimized"
        data-color={color}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="note-editor-header-opt">
          {isSomeday ? <div></div> : (
            <div className="date-display">
              <Icons.Calendar />
              <span>{formattedDate}</span>
            </div>
          )}

          <div className="actions-opt">
            <button className="icon-btn" onClick={handleSave} title="Save">
              <Icons.Check />
            </button>
            {!isNewNote && (
              <button className="icon-btn" onClick={handleDelete} title="Delete">
                <Icons.Delete />
              </button>
            )}
            <button className="icon-btn" title="Refresh">
              <Icons.Refresh />
            </button>

            <div className="color-picker-container">
              <button
                className="icon-btn color-trigger"
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Color"
              >
                <div className="color-circle-preview" data-color={color}></div>
              </button>

              {showColorPicker && (
                <div className="color-popup-opt">
                  <div className="color-grid">
                    {colors.map((c) => (
                      <button
                        key={c}
                        className={`color-swatch-opt ${c === color ? 'selected' : ''}`}
                        data-color={c}
                        onClick={() => handleColorSelect(c)}
                      >
                        {c === color && <Icons.Check />}
                      </button>
                    ))}
                  </div>
                  <div className="premium-label">Premium</div>
                </div>
              )}
            </div>

            <button className="icon-btn" title="Notifications">
              <Icons.Bell />
            </button>
            <button className="icon-btn" title="More">
              <Icons.More />
            </button>
          </div>
        </div>

        {/* Title - Visible for Someday tasks or if needed */}
        <input
          type="text"
          className="note-title-opt"
          placeholder={isSomeday ? "Tiêu đề công việc" : "Title (optional)"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus={isNewNote}
          style={{ display: isSomeday ? 'block' : 'none' }} // Show only for Someday for now, or remove style to show always
        />

        {/* Toolbar */}
        <div className="formatting-toolbar-opt">
          <button onClick={() => formatText('formatBlock', 'H2')} title="Heading"><Icons.Heading /></button>
          <button onClick={() => formatText('bold')} title="Bold"><Icons.Bold /></button>
          <button onClick={() => formatText('insertUnorderedList')} title="List"><Icons.List /></button>
          <button onClick={() => formatText('justifyLeft')} title="Align"><Icons.Align /></button>
          <button onClick={() => formatText('createLink', prompt('Enter URL:'))} title="Link"><Icons.Link /></button>
        </div>

        {/* Content - Hidden for Someday tasks */}
        {!isSomeday && (
          <div
            ref={contentRef}
            className="note-content-opt"
            contentEditable
            suppressContentEditableWarning={true}
            placeholder="Add some extra notes here..."
            onInput={(e) => {
              isUserInput.current = true;
              setContent(e.target.innerHTML);
            }}
            onPaste={handlePaste}
          />
        )}

        {/* Extra Notes Section */}
        <div className="extra-notes-section" style={{ padding: '0 24px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <div
            ref={extraNotesRef}
            className="extra-notes-editor"
            contentEditable
            suppressContentEditableWarning={true}
            placeholder="Add some extra notes here..."
            style={{
              minHeight: '60px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              outline: 'none',
              color: '#374151'
            }}
            onInput={(e) => {
              setExtraNotes(e.target.innerHTML);
            }}
            onPaste={handlePaste}
          />
        </div>

        {/* Subtasks List */}
        {subtasks.length > 0 && (
          <div style={{ padding: '0 24px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            {subtasks.map((task) => (
              <div key={task.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '8px 0' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                }}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleSubtask(task.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ 
                    flex: 1, 
                    textDecoration: task.completed ? 'line-through' : 'none',
                    opacity: task.completed ? 0.5 : 1,
                    fontSize: '14px'
                  }}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(task.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="note-footer-opt">
          <div className="subtask-input-wrapper">
            <Icons.Lock />
            <input 
              type="text" 
              placeholder="Add subtask..." 
              className="subtask-input"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={handleAddSubtask}
            />
            {newSubtask.trim() && (
              <button 
                onClick={handleAddSubtask}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#111',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Add Subtask"
              >
                <Icons.Check />
              </button>
            )}
          </div>
          <button className="icon-btn attach-btn">
            <Icons.Paperclip />
          </button>
        </div>
      </div>
    </div>
  );
}
