import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  currentTitle: string;
  onClose: () => void;
  onRename: (newTitle: string) => void;
}

export default function RenameModal({ isOpen, currentTitle, onClose, onRename }: RenameModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim() && title !== currentTitle) {
      onRename(title.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center animate-fade-in p-4">
      <div 
        className="bg-bg-sidebar rounded-xl shadow-2xl w-full max-w-md border border-border-color animate-scale-in"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h3 className="font-semibold text-lg text-text-primary">Rename Conversation</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <label className="block text-sm text-text-secondary mb-2">
            Conversation Title
          </label>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-bg-input border border-border-color rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-send-blue transition-all"
            placeholder="Enter conversation title..."
            maxLength={100}
          />
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-bg-input hover:bg-accent text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || title === currentTitle}
              className="flex-1 px-4 py-2 rounded-lg bg-send-blue hover:bg-send-blue-hover text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
