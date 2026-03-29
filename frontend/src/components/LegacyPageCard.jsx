export function LegacyPageCard({ href, label }) {
  return (
    <a
      href={href}
      className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-sm uppercase tracking-wide text-slate-500">Legacy page</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{label}</h2>
      <p className="mt-2 text-sm text-slate-600 group-hover:text-slate-900">Open {href}</p>
    </a>
  );
}
