import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 transition disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variantStyles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white',
      outline: 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ className, children, ...props }) => {
  return (
    <label
      className={cn('block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5', className)}
      {...props}
    >
      {children}
    </label>
  );
};

export const ErrorMessage: React.FC<{ error?: string | null; schema?: any }> = ({ error }) => {
  if (!error) return null;
  return <p className="text-[11px] text-rose-500 mt-1 font-medium">{error}</p>;
};

export const Avatar: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs',
        className
      )}
    >
      {children}
    </div>
  );
};

export const Menu: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cn('relative', className)}>{children}</div>;
};

// Re-export existing UI components for convenience
export * from './Sidebar';
export * from './TopNav';
export * from './BottomNav';
export * from './GlobalSearchModal';
export * from './WhatsAppModal';
