import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastNotification({ toast, onClose }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);
  useEffect(() => {
    // Total lifetime = 2500ms. Trigger exit animation a bit before removal.
    const total = 2500;
    const exitMs = 400; // match CSS exit animation duration
    const startExit = setTimeout(() => setIsClosing(true), Math.max(0, total - exitMs));
    const finalize = setTimeout(() => onClose(toast.id), total);
    return () => { clearTimeout(startExit); clearTimeout(finalize); };
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const bgColors = {
    success: 'bg-green-900/20 border-green-500/30',
    error: 'bg-red-900/20 border-red-500/30',
    info: 'bg-blue-900/20 border-blue-500/30',
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${bgColors[toast.type]} backdrop-blur-sm shadow-lg min-w-[300px] max-w-md ` + (isClosing ? 'animate-toast-exit' : 'animate-slide-in-right')}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="p-1 hover:bg-accent rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4 text-text-secondary" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastNotification toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
