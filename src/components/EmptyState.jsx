import React from 'react';

export function EmptyState({ title, message, icon = '📂', actionButton = null }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white border-2 border-dashed border-neutral-300 rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-surface-cream border-2 border-black flex items-center justify-center text-3xl shadow-brutal-sm mb-4">
        {icon}
      </div>
      <h3 className="text-lg md:text-xl font-black text-ink mb-1">{title}</h3>
      <p className="text-sm font-medium text-ink/70 max-w-sm mb-4">{message}</p>
      {actionButton && <div className="mt-2">{actionButton}</div>}
    </div>
  );
}

export default EmptyState;
