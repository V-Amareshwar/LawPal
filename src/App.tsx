import { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp.new';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OAuthFinish from './pages/OAuthFinish';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import { ToastContainer } from './components/Toast';
import type { Toast } from './components/Toast';
import { getAuthToken } from './utils/auth';
import { listConversations, createConversationApi, renameConversationApi, deleteConversationApi } from './utils/conversations';

export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

const initialConversations: Conversation[] = [];

export const Theme = {
  Light: "light",
  Dark: "dark",
  Auto: "auto",
} as const;
export type Theme = typeof Theme[keyof typeof Theme];

export interface AppConfig {
  theme: Theme;
  model: string;
}

const initialConfig: AppConfig = {
  theme: Theme.Dark,
  model: "Llama-3-8B-Instruct-q4f32_1-MLC",
};

function App() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-1');
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; profilePhoto?: string } | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    
    if (config.theme === Theme.Auto) {
      // Use system preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDarkMode);
    } else if (config.theme === Theme.Dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [config.theme]);

  // Fetch current user profile when authenticated and listen for profile/auth updates
  useEffect(() => {
    async function loadUser() {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) setUser({
            name: data.user.name,
            email: data.user.email,
            profilePhoto: data.user.profilePhoto,
          });
        }
      } catch {
        // ignore for shell
      }
    }

    loadUser();

    function onProfileUpdated(e: any) {
      const updated = e?.detail;
      if (updated && (updated.name || updated.email || updated.profilePhoto !== undefined)) {
        setUser((prev) => ({
          name: updated.name ?? prev?.name ?? '',
          email: updated.email ?? prev?.email ?? '',
          profilePhoto: updated.profilePhoto ?? prev?.profilePhoto,
        }));
      }
    }

    function onAuthLogin() {
      // Re-fetch profile after login/signup using the newest token
      loadUser();
    }

    window.addEventListener('profile:updated', onProfileUpdated);
    window.addEventListener('auth:login', onAuthLogin);
    return () => {
      window.removeEventListener('profile:updated', onProfileUpdated);
      window.removeEventListener('auth:login', onAuthLogin);
    };
  }, []);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const updateConfig = (updater: (config: AppConfig) => void) => {
    const newConfig = { ...config };
    updater(newConfig);
    setConfig(newConfig);
  };

  const createConversation = async (opts?: { silent?: boolean; title?: string }) => {
    const silent = opts?.silent ?? false;
    const title = opts?.title ?? `New Conversation`;
    try {
      const created = await createConversationApi(title);
      const newConv: Conversation = { id: created.id, title: created.title, date: created.date, messages: [] };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setIsSidebarOpen(false);
      if (!silent) showToast('New conversation created', 'success');
    } catch (e:any) {
      showToast('Failed to create conversation', 'error');
    }
  };

  const handleNewConversation = () => { void createConversation(); };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await renameConversationApi(id, newTitle);
      setConversations(prev => prev.map(conv => (conv.id === id ? { ...conv, title: newTitle } : conv)));
      showToast('Conversation renamed successfully', 'success');
    } catch {
      showToast('Failed to rename conversation', 'error');
    }
  };

  const handleNewMessage = (newMessage: Message) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, newMessage] }
          : conv
      )
    );
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversationApi(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      // Select next available conversation or create a new one
      setTimeout(async () => {
        const remaining = conversations.filter(cv => cv.id !== id);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          await createConversation({ silent: true });
        }
      }, 0);
      showToast('Conversation deleted', 'success');
    } catch {
      showToast('Failed to delete conversation', 'error');
    }
  };

  // Delete Q+A feature removed per request

  // Create or load conversations once on first mount (guarded against StrictMode double-effect)
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    (async () => {
      try {
        const token = getAuthToken();
        if (!token) return; // not signed in yet
        const list = await listConversations();
        if (list && list.length > 0) {
          const mapped = list.map(it => ({ id: it.id, title: it.title, date: it.date, messages: it.messages }));
          setConversations(mapped);
          setActiveConversationId(mapped[0].id);
        } else {
          await createConversation({ silent: true });
        }
      } catch {
        // fallback to creating one locally if listing fails
        await createConversation({ silent: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearChat = () => {
    if (!window.confirm("Are you sure you want to clear all messages in this chat?")) return;
    setConversations(prev =>
      prev.map(conv =>
        conv.id === activeConversationId
          ? { ...conv, messages: [conv.messages[0]] } // Keep the initial AI message
          : conv
      )
    );
  };

  const handleDeleteLastMessage = () => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === activeConversationId && conv.messages.length > 1) {
          const lastMessage = conv.messages[conv.messages.length - 1];
          const messagesToRemove = lastMessage.sender === 'ai' ? 2 : 1;
          return { ...conv, messages: conv.messages.slice(0, -messagesToRemove) };
        }
        return conv;
      })
    );
  };

  return (
    <Router>
      <Routes>
        {/* Public landing and auth routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-finish" element={<OAuthFinish />} />

        {/* Main app routes - with sidebar and iconbar - PROTECTED under /app/* */}
        <Route path="/app/*" element={
          <ProtectedRoute>
            <div className="flex h-screen min-w-0 w-full bg-bg-main font-sans text-text-primary overflow-hidden">
              <Sidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                setActiveConversationId={setActiveConversationId}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onNewChat={handleNewConversation}
                user={user || undefined}
              />
              <Routes>
                <Route path="/" element={
                  activeConversation && (
                    <ChatPanel
                      key={activeConversation.id}
                      conversation={activeConversation}
                      onNewMessage={handleNewMessage}
                      onClearChat={handleClearChat}
                      onDeleteLastMessage={handleDeleteLastMessage}
                      onOpenSidebar={() => setIsSidebarOpen(true)}
                      onRenameConversation={handleRenameConversation}
                      onDeleteConversation={handleDeleteConversation}
                      showToast={showToast}
                    />
                  )
                } />
                <Route path="/settings" element={
                  <Settings config={config} updateConfig={updateConfig} />
                } />
                <Route path="/profile" element={
                  <Profile />
                } />
              </Routes>
              <ToastContainer toasts={toasts} onClose={closeToast} />
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;

