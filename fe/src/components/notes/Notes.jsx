import React, { useState, useEffect, useCallback } from 'react';
import * as notesApi from '../../api/notes';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [creatingNote, setCreatingNote] = useState(false);

  console.log('[Notes] Component mounted/re-rendered, notes count:', notes.length);

  const loadNotes = useCallback(async () => {
    try {
      console.log('[Notes] Loading notes - showArchived:', showArchived, 'searchQuery:', searchQuery);
      setLoading(true);
      const fetchedNotes = await notesApi.listNotes(showArchived, searchQuery);
      console.log('[Notes] Notes loaded successfully:', fetchedNotes?.length || 0, 'notes');
      setNotes(fetchedNotes);
      setError(null);
    } catch (err) {
      console.error('[Notes] Failed to load notes:', err);
      setError('Không thể tải ghi chú');
    } finally {
      setLoading(false);
    }
  }, [showArchived, searchQuery]);

  useEffect(() => {
    console.log('[Notes] useEffect triggered, loading notes...');
    loadNotes();
  }, [loadNotes]);

  const handleCreateNote = useCallback(async (noteData) => {
    try {
      const newNote = await notesApi.createNote(noteData);
      setNotes(prev => [newNote, ...prev]);
      setCreatingNote(false);
      setSelectedNote(null); // Close modal if open
      return newNote;
    } catch (err) {
      setError('Không thể tạo ghi chú');
      console.error(err);
      throw err;
    }
  }, []);

  const handleUpdateNote = useCallback(async (noteId, updates) => {
    try {
      // If updates contains only color, we can optimistically update
      if (Object.keys(updates).length === 1 && updates.color) {
        setNotes(prev => prev.map(note =>
          note.id === noteId ? { ...note, ...updates } : note
        ));
        if (selectedNote && selectedNote.id === noteId) {
          setSelectedNote(prev => ({ ...prev, ...updates }));
        }
      }

      const updatedNote = await notesApi.updateNote(noteId, updates);
      setNotes(prev => prev.map(note =>
        note.id === noteId ? updatedNote : note
      ));

      // Update selected note if it's the one being edited
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(updatedNote);
      }

      return updatedNote;
    } catch (err) {
      setError('Không thể cập nhật ghi chú');
      console.error(err);
      throw err;
    }
  }, [selectedNote]);

  const handleDeleteNote = useCallback(async (noteId) => {
    try {
      await notesApi.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(null);
      }
    } catch (err) {
      setError('Không thể xóa ghi chú');
      console.error(err);
      throw err;
    }
  }, [selectedNote]);

  const startCreatingNote = () => {
    setCreatingNote(true);
  };

  const handleNoteClick = (note) => {
    setSelectedNote(note);
  };

  const handleCloseModal = () => {
    setSelectedNote(null);
    setCreatingNote(false);
  };

  // Filter notes based on current view
  const filteredNotes = notes.filter(note =>
    Boolean(note.is_archived) === showArchived
  );

  // Search functionality
  const displayedNotes = filteredNotes.filter(note => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title?.toLowerCase().includes(query) ||
      note.content?.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="notes-page">
      {/* Header */}
      <div className="notes-header">
        <h1>Ghi chú</h1>
        <div className="notes-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="notes-controls">
        <div className="view-toggle">
          <button
            className={!showArchived ? 'active' : ''}
            onClick={() => setShowArchived(false)}
          >
            Hoạt động ({filteredNotes.length})
          </button>
          <button
            className={showArchived ? 'active' : ''}
            onClick={() => setShowArchived(true)}
          >
            Lưu trữ ({notes.filter(n => Boolean(n.is_archived)).length})
          </button>
        </div>

        <button
          className="btn-primary"
          onClick={startCreatingNote}
        >
          ✏️ Tạo ghi chú
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message" style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '8px',
          margin: '10px 0',
          fontSize: '14px'
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="notes-loading">
          <p>Đang tải ghi chú...</p>
        </div>
      )}

      {/* Notes Grid */}
      {!loading && (
        <div className="notes-grid">
          {/* Existing Notes */}
          {displayedNotes.length === 0 ? (
            <div className="notes-empty">
              <h3>
                {searchQuery ?
                  `Không tìm thấy ghi chú nào cho "${searchQuery}"` :
                  showArchived ?
                    'Chưa có ghi chú nào được lưu trữ' :
                    'Chưa có ghi chú nào'
                }
              </h3>
              <p>
                {!showArchived && !searchQuery && 'Nhấp vào "Tạo ghi chú" để bắt đầu.'}
              </p>
              {!showArchived && (
                <button className="btn-primary" onClick={startCreatingNote}>
                  📝 Tạo ghi chú đầu tiên
                </button>
              )}
            </div>
          ) : (
            displayedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleNoteClick}
                onUpdate={handleUpdateNote}
                onDelete={handleDeleteNote}
                onSelect={() => { }} // Implement selection later if needed
                isSelected={false}
              />
            ))
          )}
        </div>
      )}

      {/* Note Editor Modal (for creating or editing) */}
      {(selectedNote || creatingNote) && (
        <NoteEditor
          note={selectedNote} // null if creating
          onSave={selectedNote ?
            (data) => handleUpdateNote(selectedNote.id, data) :
            handleCreateNote
          }
          onDelete={handleDeleteNote}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
