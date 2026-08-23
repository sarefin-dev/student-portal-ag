'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';

interface NavigationButtonProps extends ButtonProps {
  href: string;
}

export function NavigationButton({ href, children, disabled, ...props }: NavigationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button 
      onClick={() => {
        startTransition(() => {
          router.push(href);
        });
      }} 
      disabled={isPending || disabled}
      {...props}
    >
      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </Button>
  );
}
