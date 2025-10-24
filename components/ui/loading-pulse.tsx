import { cn } from '@/lib/utils';

interface LoadingPulseProps {
  className?: string;
  children: React.ReactNode;
}

export function LoadingPulse({ className, children }: LoadingPulseProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {children}
    </div>
  );
}