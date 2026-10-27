import type { Account } from '../types/band';

// UI convenience only: the real enforcement is the RLS policies in supabase/migrate_06_add_iam.sql.

/** Events, reminders, songs, links and playlists: admin only (members edit just their own availability). */
export function canEditContent(account: Account): boolean {
  return account.role === 'admin';
}

/** Admins edit anyone's availability; members only their own; viewers nobody's. */
export function canEditAvailability(account: Account, memberId: string): boolean {
  return account.role === 'admin' || (account.role === 'member' && account.memberId === memberId);
}

/** Member/invite management and future admin settings. */
export function canManageAccess(account: Account): boolean {
  return account.role === 'admin';
}
