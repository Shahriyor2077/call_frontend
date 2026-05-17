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
      setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(v => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onScroll() { setOpen(false); }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {/* Trigger */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={openDropdown}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-lg text-sm bg-white text-left
            transition-shadow cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-400' : open ? 'border-indigo-400 ring-2 ring-indigo-400/30' : 'border-gray-300'}
            ${className}`}
        >
          <span className={`truncate ${isPlaceholder ? 'text-gray-400' : 'text-gray-800'}`}>
            {selected?.label ?? 'Tanlang...'}
          </span>
          <ChevronDown
            size={15}
            className={`shrink-0 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown — rendered in portal to escape overflow containers */}
        {open && typeof document !== 'undefined' && createPortal(
          <div
            style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
            className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto py-1">
              {options.map((opt, i) => {
                const active = opt.value === String(value);
                return (
                  <button
                    key={opt.value || i}
                    type="button"
                    disabled={opt.disabled}
                    onMouseDown={e => {
                      e.preventDefault();
                      onChange?.({ target: { value: opt.value } });
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-left
                      transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                      ${active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {active && opt.value !== '' && (
                      <Check size={13} className="shrink-0 text-indigo-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
