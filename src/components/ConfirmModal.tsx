import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center animate-fade-in p-4">
      <div className="bg-bg-sidebar rounded-xl shadow-2xl w-full max-w-md border border-border-color animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <div className="flex items-center gap-2">
            {isDanger && <AlertTriangle className="w-5 h-5 text-red-400" />}
            <h3 className="font-semibold text-lg text-text-primary">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-text-secondary">{message}</p>
        </div>

        <div className="flex gap-2 p-4 border-t border-border-color">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-bg-input hover:bg-accent text-text-primary transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-send-blue hover:bg-send-blue-hover text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
