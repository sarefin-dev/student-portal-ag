import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
  showSubtitle?: boolean;
  collapsed?: boolean;
  variant?: 'default' | 'dark';
}

export function Logo({
  className,
  href = '/',
  size = 'md',
  subtitle,
  showSubtitle = true,
  collapsed = false,
  variant = 'default',
}: LogoProps) {
  const sizeMap = {
    sm: { text: 'text-base', sub: 'text-[10px]', badge: 'text-sm' },
    md: { text: 'text-xl', sub: 'text-[11px]', badge: 'text-base' },
    lg: { text: 'text-2xl', sub: 'text-xs', badge: 'text-lg' },
    xl: { text: 'text-3xl', sub: 'text-sm', badge: 'text-xl' },
  };

  const currentSize = sizeMap[size];
  const isDark = variant === 'dark';

  const content = (
    <div className={cn("flex items-center select-none", className)}>
      {collapsed ? (
        <span className={cn("font-black tracking-tighter text-primary px-1", currentSize.badge)}>
          AL
        </span>
      ) : (
        <div className="flex flex-col text-left">
          <span className={cn("font-extrabold tracking-tight leading-none", isDark ? "text-white" : "text-foreground", currentSize.text)}>
            Arefin<span className="text-primary">Lab</span>
          </span>
          {showSubtitle && subtitle && (
            <span className={cn("font-semibold uppercase tracking-wider text-[10px] leading-none mt-1", isDark ? "text-zinc-400" : "text-muted-foreground", currentSize.sub)}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
