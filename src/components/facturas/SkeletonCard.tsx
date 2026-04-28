export function SkeletonCard() {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 flex items-center gap-5 animate-pulse">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-100 rounded-full w-2/3" />
        <div className="h-3 bg-gray-100 rounded-full w-1/3" />
      </div>
      <div className="space-y-2.5 text-right">
        <div className="h-5 bg-gray-100 rounded-full w-28" />
        <div className="h-3 bg-gray-100 rounded-full w-16 ml-auto" />
      </div>
    </div>
  );
}
