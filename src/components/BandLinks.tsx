import { useState } from 'react';
import { addBandLink, deleteBandLink } from '../data/bandService';
import type { Band } from '../types/band';
import { LinkList } from './LinkList';

interface BandLinksProps {
  band: Band;
  canEdit: boolean;
  apply: (next: Promise<Band>) => Promise<boolean>;
}

// Collapsible strip under the header with the band-wide links. Collapsed by default; hidden when there
// is nothing to show and nothing the viewer can add.
export function BandLinks({ band, canEdit, apply }: BandLinksProps) {
  const [open, setOpen] = useState(false);

  if (band.links.length === 0 && !canEdit) {
    return null;
  }

  return (
    <section className="band-links">
      <button type="button" className="band-links-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>🔗 קישורים{band.links.length > 0 && ` (${band.links.length})`}</span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="band-links-panel">
          <LinkList
            links={band.links}
            canEdit={canEdit}
            emptyText="אין קישורים עדיין."
            onAdd={(description, url) => apply(addBandLink(band.id, band.links.length, description, url))}
            onDelete={(linkId) => apply(deleteBandLink(band.id, linkId))}
          />
        </div>
      )}
    </section>
  );
}
