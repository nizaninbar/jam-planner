import { useCallback, useEffect, useState } from 'react';
import {
  createInvite,
  listAccounts,
  listPendingInvites,
  revokeAccess,
  revokeInvite,
  setAccountRole,
  setMemberRole,
  type AccountRow,
  type PendingInvite,
} from '../data/authService';
import type { Band, Role } from '../types/band';

const ROLE_LABELS: Record<Role, string> = { admin: 'מנהל', member: 'חבר', viewer: 'צופה' };
const ROLES: Role[] = ['admin', 'member', 'viewer'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL');
}

interface MembersAdminViewProps {
  band: Band;
}

export function MembersAdminView({ band }: MembersAdminViewProps) {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<{ label: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(
    () =>
      Promise.all([listAccounts(band.id), listPendingInvites(band.id)])
        .then(([a, i]) => {
          setAccounts(a);
          setInvites(i);
        })
        .catch((err: Error) => setError(err.message)),
    [band.id],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = (action: () => Promise<unknown>) => {
    setError(null);
    action()
      .then(refresh)
      .catch((err: Error) => setError(err.message));
  };

  const invite = (memberId: string | null, label: string, role: Role) => {
    run(async () => {
      const url = await createInvite(band.id, memberId, role);
      setNewLink({ label, url });
      setCopied(false);
    });
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // clipboard is unavailable on non-secure pages; the link stays selectable in the box
    }
  };

  const memberName = (memberId?: string) => band.members.find((m) => m.id === memberId)?.name ?? 'צופה ללא חבר';
  const viewerAccounts = accounts.filter((a) => !a.memberId);

  return (
    <div className="page-container">
      <h2 className="page-title">ניהול גישה</h2>
      {error && <p className="error-text">{error}</p>}

      {newLink && (
        <div className="link-box">
          <strong>קישור הזמנה עבור {newLink.label}</strong>
          <p className="muted">תקף ל-7 ימים, לשימוש חד-פעמי. הוא לא יוצג שוב.</p>
          <input type="text" dir="ltr" readOnly value={newLink.url} onFocus={(e) => e.target.select()} />
          <button type="button" className="toggle-btn toggle-available" onClick={() => void copy(newLink.url)}>
            {copied ? '✓ הועתק' : 'העתק קישור'}
          </button>
        </div>
      )}

      <ul className="item-list">
        {band.members.map((member) => {
          const devices = accounts.filter((a) => a.memberId === member.id);
          const pending = invites.filter((i) => i.memberId === member.id);
          const role = devices[0]?.role ?? pending[0]?.role ?? 'member';
          const googleLinked = devices.some((d) => d.googleLinked);
          return (
            <li key={member.id} className="member-card">
              <div className="member-card-head">
                <span className="list-item-title">{member.name}</span>
                <span className="list-item-meta">
                  {devices.length === 0
                    ? pending.length > 0
                      ? 'הוזמן/ה'
                      : 'אין גישה'
                    : `${devices.length} מכשירים${googleLinked ? ' · Google מחובר' : ' · ללא Google'}`}
                </span>
              </div>
              <div className="inline-form">
                <select
                  value={role}
                  disabled={devices.length === 0}
                  onChange={(e) => run(() => setMemberRole(band.id, member.id, e.target.value as Role))}
                  aria-label={`תפקיד של ${member.name}`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <button type="button" className="toggle-btn toggle-available" onClick={() => invite(member.id, member.name, role)}>
                  + קישור הזמנה
                </button>
              </div>
              {devices.map((device, index) => (
                <div className="order-row" key={device.userId}>
                  <span className="list-item-meta">
                    מכשיר {index + 1} · {device.googleLinked ? 'Google' : 'אנונימי'} · {formatDate(device.createdAt)}
                  </span>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => run(() => revokeAccess(band.id, { userId: device.userId }))}
                    aria-label="נתק מכשיר"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {pending.map((p) => (
                <div className="order-row" key={p.id}>
                  <span className="list-item-meta">הזמנה ממתינה · עד {formatDate(p.expiresAt)}</span>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => run(() => revokeInvite(p.id))}
                    aria-label="בטל הזמנה"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {devices.length > 0 && (
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() =>
                    window.confirm(`לשלול את כל הגישה של ${member.name}?`) &&
                    run(() => revokeAccess(band.id, { memberId: member.id }))
                  }
                >
                  שלול גישה
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <h3 className="section-title">צופים (ללא חבר בלהקה)</h3>
      {viewerAccounts.length === 0 && invites.filter((i) => !i.memberId).length === 0 && (
        <p className="muted">אין צופים.</p>
      )}
      <ul className="item-list">
        {viewerAccounts.map((account, index) => (
          <li key={account.userId} className="order-row">
            <span className="list-item-meta">
              {memberName(account.memberId)} {index + 1} · {account.googleLinked ? 'Google' : 'אנונימי'} ·{' '}
              {formatDate(account.createdAt)}
            </span>
            <select
              value={account.role}
              onChange={(e) => run(() => setAccountRole(band.id, account.userId, e.target.value as Role))}
              aria-label="תפקיד"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => run(() => revokeAccess(band.id, { userId: account.userId }))}
              aria-label="שלול גישה"
            >
              ✕
            </button>
          </li>
        ))}
        {invites
          .filter((i) => !i.memberId)
          .map((p) => (
            <li key={p.id} className="order-row">
              <span className="list-item-meta">
                הזמנה ממתינה ({ROLE_LABELS[p.role]}) · עד {formatDate(p.expiresAt)}
              </span>
              <button type="button" className="icon-btn danger" onClick={() => run(() => revokeInvite(p.id))} aria-label="בטל הזמנה">
                ✕
              </button>
            </li>
          ))}
      </ul>
      <button type="button" className="toggle-btn toggle-available" onClick={() => invite(null, 'צופה', 'viewer')}>
        + הזמן צופה
      </button>
    </div>
  );
}
