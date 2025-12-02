// fe/src/components/notes/NoteCard.jsx
import React from 'react';

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (diffDays === 1) {
    return 'Hôm qua';
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
}

function truncateText(text, maxLength = 200) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function NoteCard({
  note,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onUpdate
}) {
  const handleTogglePin = (e) => {
    e.stopPropagation();
    onUpdate(note.id, { is_pinned: !note.is_pinned });
  };

  const handleToggleArchive = (e) => {
    e.stopPropagation();
    onUpdate(note.id, { is_archived: !note.is_archived });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa ghi chú này?')) {
      onDelete(note.id);
    }
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(note.id);
  };

  return (
    <div
      className={`note-card ${isSelected ? 'selected' : ''} ${note.is_pinned ? 'pinned' : ''}`}
      data-color={note.color}
      style={note.color && note.color.startsWith('#') ? { backgroundColor: note.color } : undefined}
      onClick={() => onEdit(note)}
    >
      {/* Selection checkbox */}
      <div className="note-select">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Pin indicator */}
      {note.is_pinned && (
        <div className="pin-indicator">
          📌
        </div>
      )}

      {/* Note content */}
      <div className="note-content">
        {note.title && (
          <h3 className="note-title">
            {truncateText(note.title, 50)}
          </h3>
        )}

        {note.content && (
          <p className="note-text">
            {truncateText(note.content)}
          </p>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="note-tags">
            {note.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="tag-more">+{note.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Note footer */}
      <div className="note-footer">
        <div className="note-date">
          {formatDate(note.updated_at)}
        </div>

        <div className="note-actions">
          <button
            className="action-btn"
            title={note.is_pinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
            onClick={handleTogglePin}
          >
            {note.is_pinned ? '📍' : '📌'}
          </button>

          <button
            className="action-btn"
            title={note.is_archived ? 'Khôi phục' : 'Lưu trữ'}
            onClick={handleToggleArchive}
          >
            {note.is_archived ? '📄' : '📁'}
          </button>

          <button
            className="action-btn delete-btn"
            title="Xóa ghi chú"
            onClick={handleDelete}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
