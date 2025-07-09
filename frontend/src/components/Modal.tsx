import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && ref.current) {
      ref.current.focus();
    }
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      tabIndex={-1}
      ref={ref}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#232946] border border-[#2e335a] rounded-xl shadow-2xl p-6 w-full max-w-xs text-center animate-fade-in"
      >
        {children}
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeInScale 0.2s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95);}
          to { opacity: 1; transform: scale(1);}
        }
      `}</style>
    </div>,
    document.body
  );
} 