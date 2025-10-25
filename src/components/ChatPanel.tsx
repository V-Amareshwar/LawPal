import { useState, useRef, useEffect } from 'react';
import { Pencil, Share2, MoreHorizontal, Menu, Download, Trash2, Copy } from 'lucide-react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import RenameModal from './RenameModal';
import ConfirmModal from './ConfirmModal';
import type { Conversation, Message } from '../App';
import type { ToastType } from './Toast';
import { sendChatMessage } from '../utils/api';
import { appendMessageApi } from '../utils/conversations';

interface ChatPanelProps {
  conversation: Conversation;
  onNewMessage: (message: Message) => void;
  onClearChat: () => void;
  onDeleteLastMessage: () => void;
  onOpenSidebar?: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void | Promise<void>;
  showToast: (message: string, type?: ToastType) => void;
}

const TypingIndicator = () => (
  <div className="flex items-start gap-4 animate-fade-in">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-sidebar flex items-center justify-center">
      <img src="/mlc-logo.png" alt="AI Avatar" className="w-7 h-7 p-0.5" />
    </div>
    <div className="bg-bg-sidebar rounded-lg p-4 max-w-xl flex items-center space-x-1.5">
      <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
      <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
      <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
    </div>
  </div>
);

export default function ChatPanel({ conversation, onNewMessage, onClearChat, onDeleteLastMessage, onOpenSidebar, onRenameConversation, onDeleteConversation, showToast }: ChatPanelProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversation.messages, isTyping]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreMenu]);

  const handleSendMessage = async (text: string) => {
    // If this is the first user message in this conversation, use it to name the chat
    if (conversation.messages.length === 0) {
      const raw = text.replace(/\s+/g, ' ').trim();
      const title = raw.length > 60 ? raw.slice(0, 57) + '…' : raw || 'New Conversation';
      onRenameConversation(conversation.id, title);
    }
    onNewMessage({ sender: 'user', text });
    try { await appendMessageApi(conversation.id, 'user', text); } catch { /* ignore UI */ }
    setIsTyping(true);
    try {
      const reply = await sendChatMessage(text);
      onNewMessage({ sender: 'ai', text: reply });
      try { await appendMessageApi(conversation.id, 'ai', reply); } catch { /* ignore UI */ }
    } catch (err: any) {
      const msg = err?.message || 'Failed to get response from server';
      showToast(msg, 'error');
      onNewMessage({ sender: 'ai', text: `Error: ${msg}` });
      try { await appendMessageApi(conversation.id, 'ai', `Error: ${msg}`); } catch { /* ignore */ }
    } finally {
      setIsTyping(false);
    }
  };

  const handleRename = () => {
    setShowRenameModal(true);
    setShowMoreMenu(false);
  };

  const handleShare = async () => {
    const chatText = conversation.messages
      .map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`)
      .join('\n\n');
    
    // Try native share first (mobile/modern browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: conversation.title,
          text: chatText,
        });
        // Don't show toast - native share UI provides its own feedback
        // The promise resolves when dialog opens, not when sharing completes
      } catch (error: any) {
        // User cancelled share - don't show any toast (AbortError)
        // Only show error if it's a real failure
        if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
          showToast('Share unavailable', 'error');
        }
      }
    } else {
      // Fallback to clipboard for desktop browsers that don't support share
      try {
        await navigator.clipboard.writeText(chatText);
        showToast('Conversation copied to clipboard', 'success');
      } catch {
        showToast('Failed to copy to clipboard', 'error');
      }
    }
  };

  const handleExport = () => {
    const chatText = conversation.messages
      .map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMoreMenu(false);
    showToast('Conversation exported successfully', 'success');
  };

  // Delete Q+A feature removed per request

  const handleDeleteConversation = () => {
    setShowDeleteConfirm(true);
    setShowMoreMenu(false);
  };

  return (
    <main className="flex-1 flex flex-col bg-bg-main min-w-0 w-full min-h-0 h-full">
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 sm:p-4 border-b border-border-color">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            className="p-2 rounded-md hover:bg-accent md:hidden flex-shrink-0"
            aria-label="Open sidebar"
            onClick={onOpenSidebar}
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm sm:text-base text-text-primary truncate">{conversation.title}</h2>
            <p className="text-xs text-text-secondary">{conversation.messages.length} messages</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button 
            onClick={handleRename}
            className="p-1.5 sm:p-2 rounded-md hover:bg-accent group transition-colors duration-200"
            title="Rename conversation"
          >
            <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary group-hover:text-text-primary" />
          </button>
          <button 
            onClick={handleShare}
            className="p-1.5 sm:p-2 rounded-md hover:bg-accent group transition-colors duration-200"
            title="Share conversation"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary group-hover:text-text-primary" />
          </button>
          <div className="relative" ref={moreMenuRef}>
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 sm:p-2 rounded-md hover:bg-accent group transition-colors duration-200"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary group-hover:text-text-primary" />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-sidebar border border-border-color rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={handleExport}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2 text-text-primary"
                >
                  <Download className="w-4 h-4" />
                  Export as TXT
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(conversation.messages.map(m => m.text).join('\n\n'));
                    showToast('All messages copied to clipboard', 'success');
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2 text-text-primary"
                >
                  <Copy className="w-4 h-4" />
                  Copy All Messages
                </button>
                <div className="border-t border-border-color my-1"></div>
                <button
                  onClick={handleDeleteConversation}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:p-6 space-y-4">
        {conversation.messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} showToast={showToast} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        onClearChat={onClearChat}
        onDeleteLastMessage={onDeleteLastMessage}
      />

      <RenameModal
        isOpen={showRenameModal}
        currentTitle={conversation.title}
        onClose={() => setShowRenameModal(false)}
        onRename={(newTitle) => onRenameConversation(conversation.id, newTitle)}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${conversation.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={async () => {
          setShowDeleteConfirm(false);
          await onDeleteConversation(conversation.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </main>
  );
}

