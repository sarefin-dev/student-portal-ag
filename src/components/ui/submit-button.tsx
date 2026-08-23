'use client';

import { useFormStatus } from 'react-dom';
import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps extends ButtonProps {
  pendingText?: React.ReactNode;
}

export function SubmitButton({ children, pendingText, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
