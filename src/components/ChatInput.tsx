import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Settings2, Paperclip, ImagePlus, Smile, Mic, Send } from 'lucide-react';
import { useChatCommand } from '../hooks/useChatCommand'; // Import the new hook

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  // Add props for the commands
  onClearChat: () => void;
  onDeleteLastMessage: () => void;
}

export default function ChatInput({ onSendMessage, onClearChat, onDeleteLastMessage }: ChatInputProps) {
  const [text, setText] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Set up the command handler 
  const command = useChatCommand({
    clear: onClearChat,
    del: onDeleteLastMessage,
  });

  // Auto-grow textarea effect 
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) return;

    // Check if the input is a command before sending 
    const { matched, invoke } = command.match(trimmedText);
    if (matched) {
      invoke();
    } else {
      onSendMessage(trimmedText);
    }

    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
  handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <footer className="flex-shrink-0 p-2 sm:p-3 md:p-4">
      <form onSubmit={handleSubmit} className="bg-bg-input rounded-xl p-1.5 sm:p-2 flex flex-col max-w-4xl mx-auto focus-within:ring-2 focus-within:ring-send-blue transition-shadow duration-200">
        <div className="hidden sm:flex items-center space-x-2 p-2">
          {[Settings2, Paperclip, ImagePlus, Smile, Mic].map((Icon, index) => (
            <button key={index} type="button" className="p-1 rounded hover:bg-accent group transition-colors duration-200">
              <Icon className="w-5 h-5 text-text-secondary group-hover:text-text-primary" />
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 p-2">
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a message, or type : for commands..."
            className="w-full bg-transparent text-text-primary placeholder-text-secondary resize-none focus:outline-none flex-1 max-h-32 sm:max-h-48 text-sm sm:text-base"
            rows={1}
          />
          <button 
            type="submit" 
            className="bg-send-blue hover:bg-send-blue-hover text-white font-semibold rounded-lg py-2 px-3 sm:py-2.5 sm:px-4 flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-w-[60px] sm:min-w-[80px]" 
            disabled={!text.trim()}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </footer>
  );
}