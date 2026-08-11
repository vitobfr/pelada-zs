import { useEffect, useRef, ReactNode } from 'react';
import { BrutalCard } from './ui/BrutalCard';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  footer?: ReactNode;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md', footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-brutal-black/80 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <BrutalCard className={`w-full ${maxWidth} max-h-[90vh] overflow-hidden p-0 border-0 flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b-4 border-brutal-black bg-brutal-green">
          <h2 className="font-display text-xl font-black uppercase tracking-widest text-brutal-black">{title}</h2>
          <button
            onClick={onClose}
            className="text-brutal-black hover:bg-brutal-red hover:text-white border-2 border-brutal-black bg-brutal-white w-8 h-8 flex items-center justify-center cursor-pointer transition-colors shadow-brutal-sm font-black"
          >
            ✕
          </button>
        </div>
        <div className="p-6 bg-brutal-white flex-1 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="p-4 bg-brutal-white border-t-4 border-brutal-black">
            {footer}
          </div>
        )}
      </BrutalCard>
    </div>
  );
}
