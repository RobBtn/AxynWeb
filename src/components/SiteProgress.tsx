import type { ProgressStep } from "@/lib/data";

/** Avancement d'un site vers la mise en ligne : barre + étapes, avec la prochaine action mise en avant. */
export default function SiteProgress({ steps, compact = false }: { steps: ProgressStep[]; compact?: boolean }) {
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  const percent = Math.round((done / steps.length) * 100);

  const bar = (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label="Avancement du site"
      className="h-2.5 overflow-hidden rounded-full border border-bone bg-ink"
    >
      <div className="h-full bg-accent transition-[width] duration-700" style={{ width: `${percent}%` }} />
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium">{next ? `À faire : ${next.label}` : "Tout est prêt"}</span>
          <span className="font-mono text-mute">
            {done}/{steps.length}
          </span>
        </div>
        {bar}
      </div>
    );
  }

  return (
    <section className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">{next ? "Avant la mise en ligne" : "Site prêt et en ligne"}</h2>
        <span className="font-mono text-sm">{percent} %</span>
      </div>
      {bar}
      <ol className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map((s) => (
          <li
            key={s.label}
            className={`rounded-xl border p-3 text-sm ${
              s.done ? "border-line text-mute" : s === next ? "border-bone bg-accent text-on-accent" : "border-line"
            }`}
          >
            <span className="flex items-center gap-2 font-medium">
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border text-[0.65rem] ${
                  s.done ? "border-bone bg-bone text-ink" : "border-current"
                }`}
                aria-hidden="true"
              >
                {s.done ? "✓" : ""}
              </span>
              {s.label}
              <span className="sr-only">{s.done ? " — fait" : " — à faire"}</span>
            </span>
            {s === next && <span className="mt-2 block text-xs">{s.hint}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
