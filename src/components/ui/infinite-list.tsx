'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

interface InfiniteListProps<T> {
  data: T[];
  isLoading?: boolean;
  isFetching?: boolean;
  hasMore?: boolean;
  fetchMore?: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  renderNoResults?: () => React.ReactNode;
  renderEndMessage?: () => React.ReactNode;
  renderSkeleton?: (count: number) => React.ReactNode;
}

const DefaultNoResults = () => (
  <div className="text-center text-muted-foreground py-10">No results.</div>
);

const DefaultEndMessage = () => (
  <div className="text-center text-muted-foreground py-4 text-sm">You&apos;ve reached the end.</div>
);

const DefaultSkeleton = (count: number) => (
  <>
    {Array.from({ length: count }, (_, i) => `skeleton-${i}`).map((key) => (
      <div key={key} className="animate-pulse bg-muted h-16 rounded-md" />
    ))}
  </>
);

export function InfiniteList<T>({
  data,
  isLoading = false,
  isFetching = false,
  hasMore = false,
  fetchMore,
  renderItem,
  className,
  renderNoResults = DefaultNoResults,
  renderEndMessage = DefaultEndMessage,
  renderSkeleton = DefaultSkeleton,
}: InfiniteListProps<T>) {
  const observerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetching && fetchMore) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [hasMore, isFetching, fetchMore]);

  if (isLoading) {
    return <div className={cn('space-y-4', className)}>{renderSkeleton(5)}</div>;
  }

  if (!data.length) {
    return renderNoResults();
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="space-y-2">{data.map((item, index) => renderItem(item, index))}</div>

      {isFetching && <div className="space-y-2">{renderSkeleton(3)}</div>}

      {hasMore && <div ref={observerRef} className="h-4" />}

      {!hasMore && data.length > 0 && renderEndMessage()}
    </div>
  );
}
