import { ButtonHTMLAttributes, ReactNode } from 'react';

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
  children: ReactNode;
  className?: string;
}

export function BrutalButton({ variant = 'primary', children, className = '', ...props }: BrutalButtonProps) {
  const baseStyle = "font-black uppercase tracking-widest transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brutal-green text-brutal-black py-4 px-6 text-lg border-4 border-brutal-black shadow-brutal hover:-translate-y-1 active:translate-y-1 active:translate-x-1 active:shadow-none",
    secondary: "bg-brutal-white text-brutal-black py-4 px-6 text-lg border-4 border-brutal-black shadow-brutal hover:-translate-y-1 hover:bg-brutal-bg active:translate-y-1 active:translate-x-1 active:shadow-none",
    danger: "bg-brutal-red text-white py-4 px-6 text-lg border-4 border-brutal-black shadow-brutal hover:-translate-y-1 active:translate-y-1 active:translate-x-1 active:shadow-none",
    warning: "bg-brutal-yellow text-brutal-black py-4 px-6 text-lg border-4 border-brutal-black shadow-brutal hover:-translate-y-1 active:translate-y-1 active:translate-x-1 active:shadow-none",
    ghost: "bg-transparent border-none shadow-none hover:bg-brutal-bg p-2 flex items-center justify-center",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
