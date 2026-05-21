import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
