import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
  showSubtitle?: boolean;
  collapsed?: boolean;
}

export function Logo({
  className,
  href = '/',
  size = 'md',
  subtitle,
  showSubtitle = true,
  collapsed = false,
}: LogoProps) {
  const sizeMap = {
    sm: { imgHeight: 26, text: 'text-base', sub: 'text-[10px]' },
    md: { imgHeight: 34, text: 'text-lg', sub: 'text-[11px]' },
    lg: { imgHeight: 44, text: 'text-xl', sub: 'text-xs' },
    xl: { imgHeight: 56, text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src="/sitelogo.jpg"
          alt="ArefinLab Logo"
          className="w-auto object-contain rounded-md"
          style={{ height: `${currentSize.imgHeight}px` }}
        />
      </div>
      {!collapsed && (
        <div className="flex flex-col text-left">
          <span className={cn("font-bold tracking-tight text-foreground leading-tight", currentSize.text)}>
            Arefin<span className="text-primary">Lab</span>
          </span>
          {showSubtitle && subtitle && (
            <span className={cn("text-muted-foreground font-medium uppercase tracking-wider text-[10px] leading-none mt-0.5", currentSize.sub)}>
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
