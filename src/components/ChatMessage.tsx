import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clipboard, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';
import type { ToastType } from './Toast';

interface ChatMessageProps {
  message: {
    sender: 'user' | 'ai';
    text: string;
  };
  showToast: (message: string, type?: ToastType) => void;
}

const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;

export default function ChatMessage({ message, showToast }: ChatMessageProps) {
  const { sender, text } = message;
  const parts = text.split(codeBlockRegex);
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyMessage = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
      // Don't show toast, only inline feedback
    } else {
      showToast('Failed to copy message', 'error');
    }
  };

  return (
  <div className={`group/message flex items-start gap-2 sm:gap-4 animate-fade-in ${sender === 'user' ? 'justify-end' : ''}`}>
      {sender === 'ai' && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-bg-sidebar flex items-center justify-center">
          <img src="/mlc-logo.png" alt="AI Avatar" className="w-6 h-6 sm:w-7 sm:h-7 p-0.5" />
        </div>
      )}
  <div className={`relative rounded-lg text-text-primary max-w-[85%] sm:max-w-[75%] md:max-w-2xl ${sender === 'user' ? 'bg-send-blue text-white' : 'bg-bg-sidebar'}`}>
        {parts.map((part, i) => {
          if (i % 3 === 2) {
            const language = parts[i - 1] || 'text';
            return <CodeBlock key={i} language={language} code={part.trim()} showToast={showToast} />;
          } else if (i % 3 === 0 && part.trim()) {
            return <p key={i} className="px-3 py-2 sm:px-4 sm:py-3 whitespace-pre-wrap break-words">{part.trim()}</p>;
          }
          return null;
        })}

        {/* Add a copy button for AI messages (but not for code blocks) */}
        {sender === 'ai' && parts.length === 1 && (
            <button
                onClick={handleCopyMessage}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-accent hover:bg-accent-selected opacity-0 group-hover/message:opacity-100 transition-opacity flex items-center gap-1"
                title="Copy message"
            >
                {showCopied ? (
                  <>
                    <Check size={14} className="text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <Clipboard size={14} className="text-text-secondary" />
                )}
            </button>
        )}
      </div>
    </div>
  );
}

const CodeBlock = ({ language, code, showToast }: { language: string; code: string; showToast: (message: string, type?: ToastType) => void }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
      // Don't show toast, only inline feedback
    } else {
      showToast('Failed to copy code', 'error');
    }
  };

  return (
    <div className="relative group/code overflow-hidden">
      <div className="bg-bg-icon-bar text-xs text-text-secondary px-3 sm:px-4 py-1 flex justify-between items-center rounded-t-lg">
        <span>{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs hover:text-text-primary transition-colors">
          {isCopied ? <Check size={14} /> : <Clipboard size={14} />}
          {isCopied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter language={language} style={atomDark} customStyle={{ margin: 0, borderRadius: '0 0 8px 8px', fontSize: '0.85rem' }}>
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};