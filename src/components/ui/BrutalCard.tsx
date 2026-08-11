import { ReactNode } from 'react';

interface BrutalCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function BrutalCard({ children, className = '', hoverable = false }: BrutalCardProps) {
  const base = "bg-brutal-white border-4 border-brutal-black shadow-brutal-lg";
  const hover = hoverable ? "hover:-translate-y-1 hover:shadow-[6px_6px_0_0_black] transition-all" : "";
  
  return (
    <div className={`${base} ${hover} ${className}`}>
      {children}
    </div>
  );
}
