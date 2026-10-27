import { useEffect, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { Calendar } from './components/Calendar';
import { DayEditorModal } from './components/DayEditorModal';
import { GoogleBanner } from './components/GoogleBanner';
import { NotificationsBanner } from './components/NotificationsBanner';
import { MembersAdminView } from './components/MembersAdminView';
import { NavTabs, type Section } from './components/NavTabs';
import { NoAccessScreen } from './components/NoAccessScreen';
import { PlaylistDetail } from './components/PlaylistDetail';
import { PlaylistsView } from './components/PlaylistsView';
import { SongDetail } from './components/SongDetail';
import { SongsView } from './components/SongsView';
import {
  attachGoogle,
  claimInvite,
  getMyAccount,
  hasSession,
  isGoogleLinked,
  signInWithGoogle,
  signOut,
  takeInviteToken,
  takeOAuthError,
} from './data/authService';
import {
  createEvent,
  createPlaylist,
  deleteEvent,
  getBand,
  setEventPlaylist,
  setEventReminder,
  setMemberAvailability,
} from './data/bandService';
import type { Account, AvailabilityStatus, Band, EventType } from './types/band';
import { toIsoDate } from './utils/calendar';
import { newId } from './utils/id';
import { canEditAvailability, canEditContent, canManageAccess } from './utils/permissions';

type View = { section: Section; playlistId?: string; songId?: string };

type AuthState =
  | { status: 'loading' }
  | { status: 'none'; message: string | null; signedIn: boolean }
  | { status: 'ready'; account: Account; googleLinked: boolean };

interface Session {
  auth: AuthState;
  band?: Band;
}

// Claims an invite from the URL (if any), then resolves who the user is and loads their band.
async function loadSession(oauthError: string | null, inviteToken: string | null): Promise<Session> {
  let message = oauthError;
  if (inviteToken) {
    try {
      await claimInvite(inviteToken);
    } catch (err) {
      message = `ההזמנה לא נקלטה: ${(err as Error).message}`;
    }
  }
  if (!(await hasSession())) {
    return { auth: { status: 'none', message, signedIn: false } };
  }
  const account = await getMyAccount();
  if (!account) {
    return { auth: { status: 'none', message, signedIn: true } };
  }
  const [band, googleLinked] = await Promise.all([getBand(account.bandId), isGoogleLinked()]);
  return { auth: { status: 'ready', account, googleLinked }, band };
}

// Module-level so React StrictMode's double effect doesn't consume the invite token twice.
let bootstrap: Promise<Session> | null = null;

function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  const [band, setBand] = useState<Band | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<View>({ section: 'calendar' });

  useEffect(() => {
    bootstrap ??= loadSession(takeOAuthError(), takeInviteToken());
    bootstrap
      .then((session) => {
        setAuth(session.auth);
        setBand(session.band ?? null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const handleGoogle = (action: () => Promise<void>) => {
    action().catch((err: Error) => setError(err.message));
  };

  const handleSignOut = () => {
    signOut()
      .then(() => {
        setBand(null);
        setView({ section: 'calendar' });
        setAuth({ status: 'none', message: null, signedIn: false });
      })
      .catch((err: Error) => setError(err.message));
  };

  if (error) {
    return <div className="loading">שגיאה בטעינת הנתונים: {error}</div>;
  }

  if (auth.status === 'loading') {
    return <div className="loading">טוען...</div>;
  }

  if (auth.status === 'none') {
    return (
      <NoAccessScreen
        message={auth.message}
        signedIn={auth.signedIn}
        onGoogleSignIn={() => handleGoogle(signInWithGoogle)}
        onSignOut={handleSignOut}
      />
    );
  }

  if (!band) {
    return <div className="loading">טוען...</div>;
  }

  const { account } = auth;
  const editContent = canEditContent(account);

  const handleToggle = (memberId: string, nextStatus: AvailabilityStatus) => {
    if (!selectedDate || !canEditAvailability(account, memberId)) {
      return;
    }
    setMemberAvailability(band.id, memberId, toIsoDate(selectedDate), nextStatus)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  const handleCreateEvent = (type: EventType, label: string, location?: string) => {
    if (!selectedDate) {
      return;
    }
    createEvent(band.id, toIsoDate(selectedDate), type, label, location)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(band.id, eventId)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  const apply = (next: Promise<Band>) => {
    next.then(setBand).catch((err: Error) => setError(err.message));
  };

  const openPlaylist = (playlistId: string) => {
    setSelectedDate(null);
    setView({ section: 'playlists', playlistId });
  };

  const handleCreateEventPlaylist = (eventId: string, name: string) => {
    const playlistId = newId();
    apply(
      createPlaylist(band.id, name, '', playlistId).then(() => setEventPlaylist(band.id, eventId, playlistId)),
    );
  };

  const handleLinkPlaylist = (playlistId: string, eventId: string) => {
    apply(setEventPlaylist(band.id, eventId, playlistId));
  };

  return (
    <div className="app-shell">
      <AppHeader bandName={band.name} onSignOut={handleSignOut} />
      {!auth.googleLinked && <GoogleBanner onAttach={() => handleGoogle(attachGoogle)} />}
      <NotificationsBanner bandId={band.id} />
      <NavTabs
        active={view.section}
        showAdmin={canManageAccess(account)}
        onSelect={(section) => setView({ section })}
      />
      {view.section === 'calendar' && <Calendar band={band} onDayClick={setSelectedDate} />}
      {view.section === 'admin' && canManageAccess(account) && <MembersAdminView band={band} />}
      {view.section === 'playlists' &&
        (view.playlistId ? (
          <PlaylistDetail
            band={band}
            playlistId={view.playlistId}
            apply={apply}
            canEdit={editContent}
            onOpenSong={(songId) => setView({ section: 'songs', songId })}
            onBack={() => setView({ section: 'playlists' })}
          />
        ) : (
          <PlaylistsView band={band} apply={apply} canEdit={editContent} onOpenPlaylist={openPlaylist} />
        ))}
      {view.section === 'songs' &&
        (view.songId ? (
          <SongDetail
            band={band}
            songId={view.songId}
            apply={apply}
            canEdit={editContent}
            onOpenPlaylist={openPlaylist}
            onBack={() => setView({ section: 'songs' })}
          />
        ) : (
          <SongsView
            band={band}
            apply={apply}
            canEdit={editContent}
            onOpenSong={(songId) => setView({ section: 'songs', songId })}
          />
        ))}
      {view.section === 'calendar' && selectedDate && (
        <DayEditorModal
          date={selectedDate}
          events={band.events}
          playlists={band.playlists}
          availability={band.availability}
          members={band.members}
          currentMemberId={account.memberId}
          canEditContent={editContent}
          canEditAvailability={(memberId) => canEditAvailability(account, memberId)}
          onToggle={handleToggle}
          onCreateEvent={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
          onOpenPlaylist={openPlaylist}
          onCreateEventPlaylist={handleCreateEventPlaylist}
          onLinkPlaylist={handleLinkPlaylist}
          onSetReminder={(eventId, remindAt) => apply(setEventReminder(band.id, eventId, remindAt))}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

export default App;
