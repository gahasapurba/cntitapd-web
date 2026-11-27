import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'onHero';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-bold leading-none whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,filter] duration-150 cursor-pointer ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-white border border-navy hover:brightness-110',
  gold: 'bg-gold text-gold-on border border-gold hover:brightness-105',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-subtle',
  onHero: 'bg-hero-tile text-hero-ink border border-transparent hover:brightness-125'
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-[0.82rem]',
  md: 'min-h-11 px-5 text-[0.92rem]',
  lg: 'min-h-12 px-6 text-[0.98rem]'
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function buttonClasses({ variant = 'primary', size = 'md', className }: Pick<CommonProps, 'variant' | 'size' | 'className'> = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export const Button = forwardRef<HTMLButtonElement, CommonProps & ButtonHTMLAttributes<HTMLButtonElement>>(function Button(
  { variant, size, loading = false, icon, iconRight, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses({ variant, size, className })} {...rest}>
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export const ButtonLink = forwardRef<HTMLAnchorElement, CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>>(function ButtonLink(
  { variant, size, icon, iconRight, className, children, ...rest },
  ref
) {
  return (
    <a ref={ref} className={buttonClasses({ variant, size, className })} {...rest}>
      {icon}
      {children}
      {iconRight}
    </a>
  );
});
