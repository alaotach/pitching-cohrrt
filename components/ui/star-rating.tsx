'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export function StarRating({ 
  value, 
  onChange, 
  disabled = false, 
  size = 'lg',
  readonly = false 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled || readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-all duration-200",
            sizeClasses[size],
            disabled || readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"
          )}
        >
          <Star
            className={cn(
              "w-full h-full transition-colors duration-200",
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}