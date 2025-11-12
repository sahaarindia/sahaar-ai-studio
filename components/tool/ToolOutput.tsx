import { ReactNode } from 'react';

interface ToolOutputProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
}

export function ToolOutput({ children, title, icon }: ToolOutputProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-white font-semibold text-lg">{title}</h3>
        </div>
      )}
      <div className="min-h-[300px]">
        {children}
      </div>
    </div>
  );
}
