import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  className?: string;
}

export default function Loading({
  text = "Loading...",
  className = ""
}: LoadingProps) {
  return (
    // The main container, designed to center its content.
    // min-h-[200px] gives it some default vertical space.
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
