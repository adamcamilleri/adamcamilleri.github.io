export default function TaskListSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading tasks" role="status">
      <span className="sr-only">Loading tasks...</span>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden"
        >
          {/* Priority strip skeleton */}
          <div className="w-[3px] flex-shrink-0 bg-[#222]" />

          <div className="flex-1 px-4 py-3.5">
            <div className="flex items-center gap-3">
              {/* Checkbox skeleton */}
              <div className="flex-shrink-0 w-[18px] h-[18px] rounded-full bg-[#1a1a1a] animate-pulse" />
              {/* Title skeleton - varying widths for realism */}
              <div
                className="flex-1 h-4 bg-[#1a1a1a] rounded animate-pulse"
                style={{ width: `${50 + (i * 10) % 40}%` }}
              />
              {/* Priority badge skeleton */}
              <div className="w-14 h-5 bg-[#1a1a1a] rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
