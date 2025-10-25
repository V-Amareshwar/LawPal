import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, LogOut, Plus, Settings } from 'lucide-react';
import type { Conversation } from '../App';
import { getAuthToken, signOut } from '../utils/auth';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: Dispatch<SetStateAction<string>>;
  isOpen?: boolean;
  onClose?: () => void;
  user?: { name: string; email: string; profilePhoto?: string };
  onNewChat?: () => void;
}

export default function Sidebar({ conversations, activeConversationId, setActiveConversationId, isOpen = false, onClose, user, onNewChat }: SidebarProps) {
  const navigate = useNavigate();
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [canHover, setCanHover] = useState<boolean>(true);

  useEffect(() => {
    // Detect if the device actually supports hover (desktop) vs touch (mobile)
    try {
      const mq = window.matchMedia('(hover: hover)');
      setCanHover(mq.matches);
      const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
      // @ts-ignore older browsers
      mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
      return () => {
        // @ts-ignore older browsers
        mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler);
      };
    } catch {
      setCanHover(true);
    }
  }, []);

  useEffect(() => {
    setNameInput(user?.name || '');
    setEmailInput(user?.email || '');
  }, [user?.name, user?.email]);

  // Delayed hover handlers for the profile quick panel
  const scheduleOpen = () => {
    if (!canHover) return; // Disable hover panel on touch devices
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    // Open immediately on hover (0s)
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (!showProfilePanel) {
      setShowProfilePanel(true);
    }
  };

  const scheduleClose = () => {
    if (!canHover) return; // No-op on touch devices
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    // small grace to allow moving pointer
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setShowProfilePanel(false);
      closeTimer.current = null;
    }, 100); // 0.1s delay before closing
  };

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const updateName = async () => {
    // Skip if unchanged
    if (nameInput.trim() === (user?.name || '').trim()) {
      return;
    }
    if (!nameInput.trim()) {
      setStatusMsg('Name cannot be empty');
      return;
    }
  setStatusMsg('');
    try {
      const token = getAuthToken();
      const res = await fetch('/auth/profile/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to update name');
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { name: nameInput.trim() } }));
      setStatusMsg('Name updated');
    } catch (e: any) {
      setStatusMsg(e.message || 'Failed to update name');
  } finally { /* no-op */ }
  };

  const updateEmail = async () => {
    // Skip if unchanged
    if (emailInput.trim() === (user?.email || '').trim()) {
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setStatusMsg('Enter a valid email');
      return;
    }
  setStatusMsg('');
    try {
      const token = getAuthToken();
      const res = await fetch('/auth/profile/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to update email');
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { email: emailInput.trim() } }));
      setStatusMsg('Email updated');
    } catch (e: any) {
      setStatusMsg(e.message || 'Failed to update email');
  } finally { /* no-op */ }
  };

  const uploadPhoto = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setStatusMsg('Image must be < 5MB'); return; }
  setStatusMsg('');
    try {
      const token = getAuthToken();
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch('/auth/profile/photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to upload photo');
      if (data?.photoUrl) {
        window.dispatchEvent(new CustomEvent('profile:updated', { detail: { profilePhoto: data.photoUrl } }));
        setStatusMsg('Photo updated');
      } else {
        setStatusMsg('Photo updated');
      }
    } catch (e: any) {
      setStatusMsg(e.message || 'Failed to upload photo');
  } finally { /* no-op */ }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <>
    {/* Overlay for mobile when sidebar is open */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
    )}
    <aside
      className={`bg-bg-sidebar w-72 max-w-[85vw] flex flex-col min-h-0 h-full flex-shrink-0 z-50 fixed left-0 top-0 bottom-0 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:max-w-none
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      aria-hidden={!isOpen}
    >
      <header className="p-4 border-b border-border-color flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <img src="/mlc-logo.png" alt="AI Lawyer Logo" className="w-8 h-8 mr-3 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-text-primary truncate">AI Lawyer</h1>
            <p className="text-xs text-text-secondary truncate">Your Personal Legal AI</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-md hover:bg-accent group transition-colors duration-200 flex-shrink-0"
          aria-label="Open settings"
          title="Settings"
        >
          <Settings className="w-5 h-5 text-text-secondary group-hover:text-text-primary" />
        </button>
      </header>

      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNewChat}
          className="w-full text-sm py-2 px-3 rounded-md bg-bg-sidebar text-text-secondary hover:bg-accent hover:text-text-primary transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Conversation
        </button>
      </div>
      
  <nav className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-contain">
        {conversations.map((conv) => {
          const isActive = conv.id === activeConversationId;
          return (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConversationId(conv.id);
                if (onClose) onClose();
              }}
              className={`w-full text-left block rounded-lg p-3 transition-colors duration-200 ${isActive ? 'bg-accent-selected' : 'hover:bg-accent'}`}
            >
              <p className="font-semibold text-sm truncate text-text-primary">{conv.title}</p>
              <div className="flex justify-between items-center text-xs text-text-secondary mt-1">
                <span>{conv.messages.length} messages</span>
                <span className="truncate ml-2">{conv.date}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Profile Section with hover quick-edit panel */}
   <div className="p-3 border-t border-border-color flex-shrink-0 relative"
     onMouseEnter={scheduleOpen}
     onMouseLeave={scheduleClose}>
        <div
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          onClick={() => {
            if (!canHover) {
              navigate('/profile');
              if (onClose) onClose();
            }
          }}
        >
          <div className="w-10 h-10 rounded-full bg-send-blue flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-text-primary truncate">{user?.name || 'Legal Professional'}</p>
            <p className="text-xs text-text-secondary truncate">{user?.email || 'lawyer@example.com'}</p>
          </div>
        </div>

        {/* Hover panel (desktop/hover devices only) */}
        {canHover && (
        <div
          className={`absolute left-full bottom-3 ml-2 w-80 bg-bg-sidebar border border-border-color rounded-xl p-4 z-50
            transition-all duration-300 will-change-transform will-change-opacity
            ${showProfilePanel
              ? 'opacity-100 translate-y-0 scale-100 shadow-2xl ring-1 ring-purple-500/20 pointer-events-auto'
              : 'opacity-0 translate-y-1 scale-95 shadow-md pointer-events-none'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center overflow-hidden relative">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-text-secondary" />
              )}
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-600">
                <Camera className="w-3 h-3 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && uploadPhoto(e.target.files[0])} />
              </label>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{user?.name || 'Legal Professional'}</p>
              <p className="text-xs text-text-secondary truncate">{user?.email || 'lawyer@example.com'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-xs text-text-secondary">Full Name</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={updateName}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); updateName(); } }}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-color text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Email</label>
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onBlur={updateEmail}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); updateEmail(); } }}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-color text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => navigate('/profile')} className="flex-1 text-xs px-3 py-2 bg-accent text-text-primary rounded-lg hover:bg-accent-selected">Open full profile</button>
              <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>

            {statusMsg && <p className="text-xs text-text-secondary mt-1">{statusMsg}</p>}
          </div>
        </div>
        )}
      </div>
  </aside>
    </>
  );
}
