"use client";

import Link from 'next/link';
import React from 'react';

export interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean; // show brand text next to badge
  uppercase?: boolean; // use fully uppercase brand text
  className?: string;
  textClassName?: string;
  badgeClassName?: string;
  stacked?: boolean; // badge above text
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  ariaLabel?: string;
  useFavicon?: boolean; // render favicon.ico instead of text initials
}

// Centralized brand constants
const BRAND_NAME_STANDARD = 'Süni Intellekt';
const BRAND_NAME_UPPER = 'SÜNİ İNTELLEKT';

// Simple classNames combiner (avoids external dependency)
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export const Logo: React.FC<LogoProps> = ({
  href = '/',
  size = 'md',
  showText = true,
  uppercase = false,
  className,
  textClassName,
  badgeClassName,
  stacked = false,
  onClick,
  ariaLabel = 'Go to Süni Intellekt home'
  ,useFavicon = true
}) => {
  const sizeMap = {
    sm: { badge: 'w-8 h-8 text-xs', gap: 'gap-2', text: 'text-base' },
    md: { badge: 'w-10 h-10 text-sm', gap: 'gap-3', text: 'text-lg' },
    lg: { badge: 'w-12 h-12 text-base', gap: 'gap-4', text: 'text-xl' }
  } as const;

  const s = sizeMap[size];
  const brand = uppercase ? BRAND_NAME_UPPER : BRAND_NAME_STANDARD;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'group inline-flex select-none items-center font-sans font-extrabold tracking-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500',
        stacked && 'flex-col',
        !stacked && s.gap,
        className
      )}
    >
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br from-purple-200 via-violet-200 to-blue-200 flex items-center justify-center text-purple-700 shadow-md ring-1 ring-black/5 group-hover:scale-105 transition-transform overflow-hidden group-hover:from-purple-300 group-hover:via-violet-300 group-hover:to-blue-300',
          s.badge,
          badgeClassName
        )}
      >
        {useFavicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/favicon.ico"
            alt="Logo"
            className="w-full h-full object-contain p-1"
            loading="lazy"
          />
        ) : (
          'SI'
        )}
      </div>
      {showText && (
        <span
          className={cn(
            'bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 bg-clip-text text-transparent group-hover:from-purple-500 group-hover:to-blue-500 transition-colors',
            s.text,
            stacked && 'mt-2',
            textClassName
          )}
        >
          {brand}
        </span>
      )}
    </Link>
  );
};

export default Logo;
