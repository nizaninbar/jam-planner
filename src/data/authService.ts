import type { Account, Role } from '../types/band';
import { supabase } from './supabaseClient';

// The only file (with bandService.ts) that talks to Supabase. Identity is: an auth user (anonymous
// until the member attaches Google) + a `member_accounts` row saying which band/member/role it is.

export interface AccountRow {
  userId: string;
  memberId?: string;
  role: Role;
  googleLinked: boolean;
  createdAt: string;
}

export interface PendingInvite {
  id: string;
  memberId?: string;
  role: Role;
  expiresAt: string;
}

function fail(action: string, error: { message: string }): never {
  throw new Error(`Failed to ${action}: ${error.message}`);
}

function redirectUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

/** Reads and removes `#/invite/<token>` from the address bar. */
export function takeInviteToken(): string | null {
  const match = window.location.hash.match(/^#\/invite\/([A-Za-z0-9_-]+)/);
  if (!match) {
    return null;
  }
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return match[1];
}

/** Reads and removes an OAuth error (e.g. Google account already linked to someone else). */
export function takeOAuthError(): string | null {
  const params = new URLSearchParams(window.location.search);
  const message = params.get('error_description') ?? params.get('error');
  if (!message) {
    return null;
  }
  ['error', 'error_code', 'error_description'].forEach((key) => params.delete(key));
  const rest = params.toString();
  window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''));
  return message;
}

export function buildInviteUrl(token: string): string {
  return `${redirectUrl()}#/invite/${token}`;
}

export async function hasSession(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();
  if (error) fail('read session', error);
  return data.session !== null;
}

/** Only called when claiming an invite, so random visitors don't create anonymous users. */
export async function claimInvite(token: string): Promise<void> {
  if (!(await hasSession())) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) fail('start session', error);
  }
  const { error } = await supabase.rpc('claim_invite', { p_token: token });
  if (error) fail('claim invite', error);
}

export async function getMyAccount(): Promise<Account | null> {
  const { data, error } = await supabase
    .from('member_accounts')
    .select('band_id, member_id, role')
    .maybeSingle();
  if (error) fail('load account', error);
  if (!data) {
    return null;
  }
  return { bandId: data.band_id, role: data.role as Role, memberId: data.member_id ?? undefined };
}

export async function isGoogleLinked(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return data.user?.identities?.some((i) => i.provider === 'google') ?? false;
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl() },
  });
  if (error) fail('sign in with Google', error);
}

/** Upgrades the current (anonymous) user in place: same user id, so member + role are kept. */
export async function attachGoogle(): Promise<void> {
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: redirectUrl() },
  });
  if (error) fail('attach Google', error);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) fail('sign out', error);
}

// --- admin ---

export async function listAccounts(bandId: string): Promise<AccountRow[]> {
  const { data, error } = await supabase.rpc('admin_list_accounts', { p_band_id: bandId });
  if (error) fail('list accounts', error);
  return (data as { user_id: string; member_id: string | null; role: Role; is_anonymous: boolean; created_at: string }[]).map(
    (a) => ({
      userId: a.user_id,
      memberId: a.member_id ?? undefined,
      role: a.role,
      googleLinked: !a.is_anonymous,
      createdAt: a.created_at,
    }),
  );
}

export async function listPendingInvites(bandId: string): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('id, member_id, role, expires_at')
    .eq('band_id', bandId)
    .is('claimed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at');
  if (error) fail('list invites', error);
  return (data ?? []).map((i) => ({
    id: i.id,
    memberId: i.member_id ?? undefined,
    role: i.role as Role,
    expiresAt: i.expires_at,
  }));
}

/** Returns the invite link; the raw token cannot be recovered later. */
export async function createInvite(bandId: string, memberId: string | null, role: Role): Promise<string> {
  const { data, error } = await supabase.rpc('create_invite', {
    p_band_id: bandId,
    p_member_id: memberId,
    p_role: role,
  });
  if (error) fail('create invite', error);
  return buildInviteUrl(data as string);
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from('invites').delete().eq('id', inviteId);
  if (error) fail('revoke invite', error);
}

export async function setMemberRole(bandId: string, memberId: string, role: Role): Promise<void> {
  const { error } = await supabase.rpc('admin_set_role', {
    p_band_id: bandId,
    p_member_id: memberId,
    p_user_id: null,
    p_role: role,
  });
  if (error) fail('change role', error);
}

export async function setAccountRole(bandId: string, userId: string, role: Role): Promise<void> {
  const { error } = await supabase.rpc('admin_set_role', {
    p_band_id: bandId,
    p_member_id: null,
    p_user_id: userId,
    p_role: role,
  });
  if (error) fail('change role', error);
}

/** Revokes one device/account (userId) or every device of a member (memberId). */
export async function revokeAccess(bandId: string, target: { memberId?: string; userId?: string }): Promise<void> {
  const { error } = await supabase.rpc('admin_revoke', {
    p_band_id: bandId,
    p_member_id: target.memberId ?? null,
    p_user_id: target.userId ?? null,
  });
  if (error) fail('revoke access', error);
}
