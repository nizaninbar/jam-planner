import { useState } from 'react';
import type { Link } from '../types/band';
import { isHttpUrl } from '../utils/playlists';
import { Icon } from './Icon';

interface LinkListProps {
  links: Link[];
  canEdit: boolean;
  onAdd: (description: string, url: string) => void;
  onDelete: (linkId: string) => void;
  /** Shown when there are no links; omit to render nothing in that case. */
  emptyText?: string;
}

// Clickable links (description + URL) with, for admins, a delete button and an add form.
// Shared by songs and the band-wide header strip.
export function LinkList({ links, canEdit, onAdd, onDelete, emptyText }: LinkListProps) {
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!isHttpUrl(trimmed)) {
      setError('הכתובת חייבת להתחיל ב-http:// או https://');
      return;
    }
    setError(null);
    onAdd(description.trim(), trimmed);
    setDescription('');
    setUrl('');
  };

  return (
    <>
      {links.length === 0 && emptyText && <p className="muted">{emptyText}</p>}
      <ul className="item-list">
        {links.map((link) => (
          <li key={link.id} className="order-row">
            <a className="list-item" href={link.url} target="_blank" rel="noopener noreferrer">
              <span className="list-item-title">{link.description || link.url}</span>
              {link.description && <span className="list-item-meta link-url">{link.url}</span>}
            </a>
            {canEdit && (
              <button type="button" className="icon-btn danger" onClick={() => onDelete(link.id)} aria-label="מחק קישור">
                <Icon name="close" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <div className="form-stack">
          <input
            type="text"
            placeholder="תיאור (למשל: הקלטת חזרה)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input type="url" dir="ltr" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          {error && <p className="error-text">{error}</p>}
          <button type="button" className="toggle-btn toggle-available" onClick={handleAdd}>
            + הוסף קישור
          </button>
        </div>
      )}
    </>
  );
}
