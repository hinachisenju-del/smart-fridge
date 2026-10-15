import React from 'react';

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  staggerMs?: number;
}

/**
 * AnimatedList (React Bits)
 * Renders list items with subtle staggered entrance animations.
 * Automatically respects `prefers-reduced-motion` via CSS media queries.
 */
export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className = 'space-y-2',
  staggerMs = 35,
}: AnimatedListProps<T>) {
  return (
    <div className={className}>
      {items.map((item, index) => {
        const key = keyExtractor(item, index);
        const delay = Math.min(index * staggerMs, 350); // cap delay so long lists don't wait forever

        return (
          <div
            key={key}
            className="transition-all duration-200 animate-in fade-in slide-in-from-bottom-1"
            style={{
              animationDelay: `${delay}ms`,
              animationFillMode: 'both',
            }}
          >
            {renderItem(item, index)}
          </div>
        );
      })}
    </div>
  );
}
