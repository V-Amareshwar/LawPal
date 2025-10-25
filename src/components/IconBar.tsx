import { HelpCircle, Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface IconBarProps {
  onNewChat: () => void;
}

export default function IconBar({ onNewChat }: IconBarProps) {
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex bg-bg-icon-bar w-16 flex-col items-center justify-between p-2 flex-shrink-0">
      <div />
      <div className="flex flex-col items-center space-y-2">
        <button 
          onClick={() => window.open('https://github.com/yourusername/ai-lawyer', '_blank')}
          className="p-2 rounded-lg hover:bg-accent group transition-colors"
          title="Help & Documentation"
        >
          <HelpCircle className="w-6 h-6 text-text-secondary group-hover:text-text-primary" />
        </button>
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg hover:bg-accent group transition-colors"
          title="Settings"
        >
          <Settings className="w-6 h-6 text-text-secondary group-hover:text-text-primary" />
        </button>
        <button 
          onClick={onNewChat}
          className="w-full bg-bg-sidebar text-text-secondary hover:bg-accent hover:text-text-primary p-2 rounded-lg flex items-center justify-center text-sm mt-4 transition-colors"
          title="New Conversation"
        >
          <Plus className="w-5 h-5 mr-1" />New
        </button>
      </div>
    </aside>
  );
}