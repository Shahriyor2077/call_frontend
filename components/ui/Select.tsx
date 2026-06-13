'use client';

import { useState, useRef, useEffect, ReactNode, Children, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

function nodeToString(node: ReactNode): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join('');
  if (isValidElement(node)) return nodeToString((node.props as any).children);
  return '';
}

interface SelectProps {
  label?: string;
  error?: string;
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  children?: ReactNode;
}

export default function Select({
  label, error, value = '', onChange, className = '', disabled, children,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const [animate, setAnimate] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const options: { value: string; label: string; disabled?: boolean }[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === 'option') {
      const p = child.props as any;
      options.push({
        value: String(p.value ?? ''),
        label: nodeToString(p.children),
        disabled: p.disabled,
      });
    }
  });

  const selected = options.find(o => o.value === String(value));
  const isPlaceholder = !selected || selected.value === '';

  function openDropdown() {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
      setOpen(true);
      requestAnimationFrame(() => setAnimate(true));
    } else {
      setAnimate(false);
      setTimeout(() => setOpen(false), 150);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setAnimate(false);
        setTimeout(() => setOpen(false), 150);
      }
    }
    function onScroll() {
      setAnimate(false);
      setTimeout(() => setOpen(false), 150);
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const placeholderOpts = options.filter(o => o.value === '');
  const realOpts = options.filter(o => o.value !== '');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        {/* Trigger */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={openDropdown}
          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 border rounded-xl text-sm bg-white text-left
            transition-all duration-150 cursor-pointer
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? 'border-red-300 ring-2 ring-red-100'
              : open
              ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 shadow-sm'
            }
            ${className}`}
        >
          <span className={`truncate ${isPlaceholder ? 'text-gray-400' : 'text-gray-800 font-medium'}`}>
            {selected?.label ?? 'Tanlang...'}
          </span>
          <ChevronDown
            size={15}
            className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-indigo-500' : 'text-gray-400'}`}
          />
        </button>

        {/* Dropdown portal */}
        {open && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              top: dropPos.top,
              left: dropPos.left,
              width: dropPos.width,
              zIndex: 9999,
              transformOrigin: 'top center',
              transform: animate ? 'scaleY(1) translateY(0)' : 'scaleY(0.92) translateY(-6px)',
              opacity: animate ? 1 : 0,
              transition: 'transform 150ms ease, opacity 150ms ease',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            }}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-1.5">
              {/* Placeholder option */}
              {placeholderOpts.map((opt, i) => (
                <button
                  key={`ph-${i}`}
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    onChange?.({ target: { value: opt.value } });
                    setAnimate(false);
                    setTimeout(() => setOpen(false), 150);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-400 text-left rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="truncate italic">{opt.label}</span>
                </button>
              ))}

              {/* Divider if placeholder exists */}
              {placeholderOpts.length > 0 && realOpts.length > 0 && (
                <div className="mx-2 my-1 border-t border-gray-100" />
              )}

              {/* Real options */}
              {realOpts.map((opt, i) => {
                const active = opt.value === String(value);
                return (
                  <button
                    key={opt.value || i}
                    type="button"
                    disabled={opt.disabled}
                    onMouseDown={e => {
                      e.preventDefault();
                      onChange?.({ target: { value: opt.value } });
                      setAnimate(false);
                      setTimeout(() => setOpen(false), 150);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-left rounded-xl
                      transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed
                      ${active
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {active && (
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-indigo-600" />
                      </div>
                    )}
                  </button>
                );
              })}

              {options.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-4">Variantlar yo'q</p>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
