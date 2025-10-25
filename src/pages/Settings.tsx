import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X as CloseIcon, Palette, ChevronRight, Cpu } from 'lucide-react';
import { List, ListItem } from '../components/ui/List';
import type { AppConfig } from '../App';
import { Theme } from '../App';
import ModelSelect from '../components/ModelSelect';

interface SettingsProps {
  config: AppConfig;
  updateConfig: (updater: (config: AppConfig) => void) => void;
}

export default function Settings({ config, updateConfig }: SettingsProps) {
  const navigate = useNavigate();
  const [showModelSelector, setShowModelSelector] = useState(false);

  const handleSelectModel = (model: string) => {
    updateConfig(cfg => { cfg.model = model; });
    setShowModelSelector(false);
  };

  return (
    <>
    <div className="flex flex-col h-full bg-bg-main animate-fade-in min-w-0 w-full">
      <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border-color">
        <div>
          <h2 className="font-semibold text-text-primary">Settings</h2>
          <p className="text-xs text-text-secondary">Configure your application</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate('/')} className="p-2 rounded-md hover:bg-accent group">
            <CloseIcon className="w-5 h-5 text-text-secondary group-hover:text-text-primary" />
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* AI Model Section */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              AI Model
            </h3>
            
            <List>
              <ListItem 
                title="Model" 
                subTitle="Select the AI model to use for conversations."
              >
                <button 
                  onClick={() => setShowModelSelector(true)}
                  className="flex items-center gap-2 bg-bg-input border border-border-color rounded-lg px-4 py-2 text-sm text-text-primary hover:bg-accent transition-all focus:outline-none focus:ring-2 focus:ring-send-blue min-w-[200px] justify-between"
                >
                  <span className="truncate">{config.model}</span>
                  <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
                </button>
              </ListItem>
            </List>
          </div>

          {/* Appearance Section */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </h3>
            
            <List>
            <ListItem 
              title="Theme" 
              subTitle="Choose between light, dark, or automatic theme based on your system preference."
            >
              <select 
                value={config.theme}
                onChange={(e) => updateConfig(cfg => { cfg.theme = e.target.value as Theme; })}
                className="bg-bg-input border border-border-color rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-send-blue transition-all min-w-[140px]"
              >
                <option value={Theme.Dark}>Dark</option>
                <option value={Theme.Light}>Light</option>
                <option value={Theme.Auto}>Auto</option>
              </select>
            </ListItem>
          </List>

          <div className="mt-6 p-4 bg-bg-sidebar border border-border-color rounded-lg">
            <p className="text-xs text-text-secondary">
              <strong className="text-text-primary">Note:</strong> Theme changes will apply to the entire application. 
              Auto mode will follow your system's theme preference.
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
    {showModelSelector && (
      <ModelSelect 
        onClose={() => setShowModelSelector(false)} 
        onSelectModel={handleSelectModel} 
      />
    )}
    </>
  );
}