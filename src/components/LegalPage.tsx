export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-6 pb-32 pt-44">
      <p className="kicker">Informations légales</p>
      <h1 className="display mt-4 text-6xl md:text-7xl">{title}</h1>
      <p className="mt-4 text-sm text-mute">Dernière mise à jour : {updated}</p>
      <div className="prose-legal mt-10">{children}</div>
    </article>
  );
}
