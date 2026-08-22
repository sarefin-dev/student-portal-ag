'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export function LocalTime({ isoString, formatStr = "PPP 'at' p" }: { isoString: string, formatStr?: string }) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    try {
      setFormatted(format(new Date(isoString), formatStr));
    } catch (e) {
      setFormatted('Invalid date');
    }
  }, [isoString, formatStr]);

  if (!formatted) {
    // Return a placeholder of roughly similar length to prevent layout shift
    return <span className="opacity-0">Loading date...</span>;
  }

  return <span>{formatted}</span>;
}
