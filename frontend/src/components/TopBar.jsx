export function TopBar({ badge }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <p className="text-lg font-semibold">Dealett</p>
        <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">{badge}</p>
      </div>
    </header>
  );
}
