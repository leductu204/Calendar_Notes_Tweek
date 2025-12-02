import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CalendarNoteLine from './CalendarNoteLine.jsx';
import NoteEditor from '../notes/NoteEditor.jsx';
import { formatHeader, isSameDay, toISODate } from '../../utils/dateHelpers.js';
import * as notesApi from '../../api/notes';

export default function CalendarNoteColumn({ date, maxLines, onHeightChange, hideCompleted }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const { day, dateText } = formatHeader(date);
  const dateKey = useMemo(() => toISODate(date), [date]);
  const today = isSameDay(date, new Date());
  const inputRefs = useRef([]);

  // Report needed height
  useEffect(() => {
    const needed = Math.max(10, notes.length);
    onHeightChange?.(needed);
  }, [notes.length, onHeightChange]);

  // Load notes for this date
  useEffect(() => {
    loadNotesForDate();
  }, [dateKey]);

  const loadNotesForDate = async () => {
    try {
      setLoading(true);
      // Search for notes tagged with this date
      const allNotes = await notesApi.listNotes(false, `calendar-${dateKey}`);

      // Sort notes by line index (from tags)
      const sortedNotes = allNotes
        .filter(note => note.tags?.some(tag => tag.startsWith(`calendar-${dateKey}`)))
        .sort((a, b) => {
          // Extract line index from tags
          const aLineTag = a.tags?.find(tag => tag.startsWith('line-'));
          const bLineTag = b.tags?.find(tag => tag.startsWith('line-'));
          const aLine = aLineTag ? parseInt(aLineTag.split('-')[1]) : 0;
          const bLine = bLineTag ? parseInt(bLineTag.split('-')[1]) : 0;
          return aLine - bLine;
        });

      setNotes(sortedNotes);
    } catch (error) {
      console.error('Error loading calendar notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const focusTopEmpty = useCallback(() => {
    const firstEmpty = (inputRefs.current || []).find(r => r && r.value.trim() === '');
    (firstEmpty || inputRefs.current?.[0])?.focus();
  }, []);

  const onColumnClick = useCallback((e) => {
    if (!e.target.closest('.calendar-note-input') && !e.target.closest('.calendar-note-button')) {
      focusTopEmpty();
    }
  }, [focusTopEmpty]);

  const onRequestFocus = useCallback((currentIdx) => {
    const refs = inputRefs.current || [];
    const emptyIdx = refs.findIndex(r => r && r.value.trim() === '');
    if (emptyIdx !== -1 && emptyIdx < currentIdx) refs[emptyIdx]?.focus();
  }, []);

  const handleNoteChange = useCallback((lineIdx, updatedNote) => {
    setNotes(prevNotes => {
      const newNotes = [...prevNotes];

      if (updatedNote) {
        // Find existing note at this line or add new one
        const existingIdx = newNotes.findIndex(note =>
          note.tags?.some(tag => tag === `line-${lineIdx}`)
        );

        if (existingIdx >= 0) {
          newNotes[existingIdx] = updatedNote;
        } else {
          newNotes.push(updatedNote);
        }
      } else {
        // Remove note at this line
        return newNotes.filter(note =>
          !note.tags?.some(tag => tag === `line-${lineIdx}`)
        );
      }

      // Sort by line index
      return newNotes.sort((a, b) => {
        const aLineTag = a.tags?.find(tag => tag.startsWith('line-'));
        const bLineTag = b.tags?.find(tag => tag.startsWith('line-'));
        const aLine = aLineTag ? parseInt(aLineTag.split('-')[1]) : 0;
        const bLine = bLineTag ? parseInt(bLineTag.split('-')[1]) : 0;
        return aLine - bLine;
      });
    });
  }, []);

  const handleOpenNote = useCallback((note) => {
    setSelectedNote(note);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedNote(null);
  }, []);

  const handleSaveNote = useCallback(async (updates) => {
    if (!selectedNote) return;

    try {
      const updatedNote = await notesApi.updateNote(selectedNote.id, updates);

      // Update local notes state
      setNotes(prevNotes =>
        prevNotes.map(note => note.id === selectedNote.id ? updatedNote : note)
      );

      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }, [selectedNote]);

  const handleDeleteNote = useCallback(async () => {
    if (!selectedNote) return;

    try {
      await notesApi.deleteNote(selectedNote.id);

      // Remove from local state
      setNotes(prevNotes => prevNotes.filter(note => note.id !== selectedNote.id));

      // Close modal
      setSelectedNote(null);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }, [selectedNote]);

  const getLineIdx = (note) => {
    const tag = note.tags?.find(t => t.startsWith('line-'));
    return tag ? parseInt(tag.split('-')[1]) : 0;
  };

  const linesToRender = useMemo(() => {
    let visibleNotes = [...notes];
    if (hideCompleted) {
      visibleNotes = visibleNotes.filter(n => !n.is_completed && !n.is_done && !n.done);
    }

    const sortedNotes = [...visibleNotes].sort((a, b) => {
      // 1. Sort by completion (Incomplete first)
      if (!!a.is_completed !== !!b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      // 2. Sort by line index within same status
      return getLineIdx(a) - getLineIdx(b);
    });

    const usedIndices = new Set(visibleNotes.map(getLineIdx));
    const availableIndices = [];
    let candidate = 0;
    // Find enough unused indices to fill up to maxLines
    // We need at least maxLines total lines, or more if we have more notes
    const totalNeeded = Math.max(maxLines, visibleNotes.length);
    const emptyNeeded = Math.max(0, totalNeeded - visibleNotes.length);

    while (availableIndices.length < emptyNeeded) {
      if (!usedIndices.has(candidate)) {
        availableIndices.push(candidate);
      }
      candidate++;
    }

    const result = [];
    // Add notes
    sortedNotes.forEach(note => {
      result.push({ note, lineIdx: getLineIdx(note) });
    });
    // Add empty lines
    availableIndices.forEach(idx => {
      result.push({ note: null, lineIdx: idx });
    });
    
    return result;
  }, [notes, maxLines, hideCompleted]);

  if (loading) {
    return (
      <div className={today ? 'column is-today' : 'column'}>
        <div className={`col-head${today ? ' is-today' : ''}`}>
          <div className="col-date">{dateText}</div>
          <div className="col-day">{day}</div>
        </div>
        <div className={today ? 'rule-strong blue' : 'rule-strong'} />
        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
          Loading notes...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={today ? 'column is-today' : 'column'} onClick={onColumnClick}>
        <div className={`col-head${today ? ' is-today' : ''}`}>
          <div className="col-date">{dateText}</div>
          <div className="col-day">{day}</div>
        </div>
        <div className={today ? 'rule-strong blue' : 'rule-strong'} />

        {linesToRender.map((item) => (
          <CalendarNoteLine
            key={`${dateKey}-${item.lineIdx}`}
            date={date}
            lineIdx={item.lineIdx}
            existingNote={item.note}
            onNoteChange={handleNoteChange}
            onOpenNote={handleOpenNote}
            inputRef={(el) => (inputRefs.current[item.lineIdx] = el)}
            onRequestFocus={onRequestFocus}
          />
        ))}
      </div>

      {/* Note Editor Modal */}
      {selectedNote && (
        <NoteEditor
          note={selectedNote}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
