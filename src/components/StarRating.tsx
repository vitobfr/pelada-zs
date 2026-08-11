interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={`${sizes[size]} bg-transparent border-none transition-transform duration-75 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'
            } ${filled ? 'text-brutal-yellow drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'text-brutal-white drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]'}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
