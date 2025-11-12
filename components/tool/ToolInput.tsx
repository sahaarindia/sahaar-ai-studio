import { ReactNode } from 'react';

interface ToolInputProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
}

export function ToolInput({ children, title, icon }: ToolInputProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-white font-semibold text-lg">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
