"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/**
 * Top-of-page indeterminate progress bar shown whenever any TanStack Query
 * request (geocode, footprint, yield, …) is in flight — so it's always clear
 * something is happening in the background.
 */
export function GlobalLoadingBar() {
  const active = useIsFetching() + useIsMutating() > 0;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden transition-opacity duration-200"
      style={{ opacity: active ? 1 : 0 }}
    >
      <div className="h-full w-2/5 animate-loading-bar rounded-r bg-amber-500" />
    </div>
  );
}
