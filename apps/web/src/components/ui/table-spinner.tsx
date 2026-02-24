import { Loader2 } from 'lucide-react';

interface TableSpinnerProps {
  colSpan?: number;
  message?: string;
}

export function TableSpinner({ colSpan = 6, message = 'Loading data...' }: TableSpinnerProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">{message}</span>
        </div>
      </td>
    </tr>
  );
}
