import { useMemo } from "react";
import { TopBar } from "./components/TopBar";
import { LegacyPageCard } from "./components/LegacyPageCard";
import { useBackendHealth } from "./hooks/useBackendHealth";

const LEGACY_PAGES = [
  { path: "/legacy/index.html", label: "Start" },
  { path: "/legacy/abonnemang.html", label: "Abonnemang" },
  { path: "/legacy/kundservice.html", label: "Kundservice" },
  { path: "/legacy/jamfor.html", label: "Jämför" },
  { path: "/legacy/account.html", label: "Konto" }
];

export default function App() {
  const { status, loading } = useBackendHealth();

  const backendBadge = useMemo(() => {
    if (loading) return "Checking backend…";
    return status?.ok ? `Backend online (${status.environment})` : "Backend unavailable";
  }, [status, loading]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar badge={backendBadge} />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold tracking-tight">Dealett full-stack frontend</h1>
          <p className="mt-3 text-slate-600">
            Legacy UI pages are preserved and now served through a React + Vite + Tailwind frontend.
            API/data responsibilities have moved to the backend service.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {LEGACY_PAGES.map((page) => (
            <LegacyPageCard key={page.path} href={page.path} label={page.label} />
          ))}
        </section>
      </main>
    </div>
  );
}
