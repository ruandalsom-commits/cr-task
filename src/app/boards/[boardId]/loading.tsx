export default function Loading() {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="flex flex-col border-b border-slate-200 px-8 pt-8 pb-0 gap-6 bg-white z-20">
        <div className="flex justify-between items-start">
          <div className="h-10 w-64 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="flex justify-between items-end">
          <div className="flex gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-6 w-24 bg-slate-200 rounded mb-2 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">Carregando quadro...</span>
        </div>
      </div>
    </div>
  );
}
