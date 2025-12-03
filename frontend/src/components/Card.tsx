import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  const baseStyles = 'bg-slate-800 rounded-xl p-6 shadow-xl transition-all duration-300';
  const hoverStyles = hover ? 'hover:transform hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : '';
  const gradientStyles = gradient ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' : '';
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${gradientStyles} ${className}`}>
      {children}
    </div>
  );
}
