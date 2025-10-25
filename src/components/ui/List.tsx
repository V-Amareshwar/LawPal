import type { ReactNode } from 'react';

export function List({ children }: { children: ReactNode }) {
  return (
    <div className="border border-border-color rounded-lg shadow-sm mb-5 animate-fade-in bg-bg-sidebar">
      {children}
    </div>
  );
}

export function ListItem({ title, subTitle, children }: { title: string; subTitle?: string; children: ReactNode }) {
  return (
    <div className="flex justify-between items-center min-h-[60px] border-b border-border-color p-4 last:border-b-0">
      <div className="flex-grow">
        <div className="font-semibold text-sm text-text-primary">{title}</div>
        {subTitle && <div className="text-xs text-text-secondary mt-1">{subTitle}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}