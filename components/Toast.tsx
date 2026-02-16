import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-emerald-500 text-white shadow-emerald-500/30';
      case 'error': return 'bg-red-500 text-white shadow-red-500/30';
      default: return 'bg-blue-500 text-white shadow-blue-500/30';
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${getColors()} animate-fade-in-up z-50 min-w-[300px]`}>
      <span className="material-icons text-xl">{getIcon()}</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="opacity-80 hover:opacity-100 transition-opacity">
        <span className="material-icons text-sm">close</span>
      </button>
    </div>
  );
};

export default Toast;