import { ReactNode } from 'react';

interface BrutalBadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'black' | 'white';
  className?: string;
}

export function BrutalBadge({ children, variant = 'primary', className = '' }: BrutalBadgeProps) {
  const base = "font-black uppercase tracking-widest border-2 border-brutal-black shadow-brutal-sm inline-block";
  
  const variants = {
    primary: "bg-brutal-yellow text-brutal-black px-4 py-1",
    secondary: "bg-brutal-green text-brutal-black px-4 py-1",
    black: "bg-brutal-black text-brutal-white px-3 py-1 text-sm",
    white: "bg-brutal-white text-brutal-black px-4 py-2",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
