export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading dashboard">
      <div className="h-10 w-64 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-36 rounded-3xl bg-slate-200" />)}
      </div>
      <div className="h-72 rounded-3xl bg-slate-200" />
    </div>
  );
}
