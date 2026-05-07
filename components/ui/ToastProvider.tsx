'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const DURATION = 4000;

const CONFIG: Record<ToastType, { Icon: React.ElementType; border: string; iconCls: string }> = {
  success: { Icon: CheckCircle,   border: 'border-l-green-500', iconCls: 'text-green-500' },
  error:   { Icon: AlertCircle,   border: 'border-l-red-500',   iconCls: 'text-red-500'   },
  info:    { Icon: Info,          border: 'border-l-blue-500',  iconCls: 'text-blue-500'  },
  warning: { Icon: AlertTriangle, border: 'border-l-amber-500', iconCls: 'text-amber-500' },
};

function ToastItem({ id, message, type, onRemove }: Toast & { onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const removeRef = useRef(onRemove);
  removeRef.current = onRemove;
  const { Icon, border, iconCls } = CONFIG[type];

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), DURATION - 300);
    const t2 = setTimeout(() => removeRef.current(id), DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [id]);

  function close() {
    setExiting(true);
    setTimeout(() => removeRef.current(id), 300);
  }

  return (
    <div
      className={`flex items-start gap-3 min-w-72 max-w-sm bg-white rounded-xl shadow-xl border border-l-4 ${border} px-4 py-3.5 transition-all duration-300 ${
        exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0 animate-slide-in'
      }`}
    >
      <Icon size={17} className={`${iconCls} shrink-0 mt-0.5`} />
      <p className="flex-1 text-[13px] text-gray-800 font-medium leading-relaxed">{message}</p>
      <button onClick={close} className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const api: ToastApi = {
    success: msg => add(msg, 'success'),
    error:   msg => add(msg, 'error'),
    info:    msg => add(msg, 'info'),
    warning: msg => add(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
