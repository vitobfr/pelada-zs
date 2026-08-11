import { InputHTMLAttributes, forwardRef } from 'react';

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  containerClassName?: string;
}

export const BrutalInput = forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ label, className = '', containerClassName = '', ...props }, ref) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label className="block text-xl font-black text-brutal-black mb-2 uppercase tracking-widest">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-brutal-bg border-4 border-brutal-black px-4 py-4 text-brutal-black placeholder:text-brutal-black/50 focus:outline-none focus:bg-white focus:-translate-y-1 focus:shadow-brutal-sm transition-all text-xl font-bold uppercase ${className}`}
          {...props}
        />
      </div>
    );
  }
);
BrutalInput.displayName = 'BrutalInput';
