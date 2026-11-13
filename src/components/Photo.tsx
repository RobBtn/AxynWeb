/**
 * Cadre photo. Avec une photo : image recadrée, dévoilée par un volet au
 * défilement. Sans photo : repère de maquette (croix + légende), pour que le
 * client voie où ira sa photo. `bare` masque la légende (site en ligne).
 */
export default function Photo({
  src,
  label,
  className = "",
  bare = false,
}: {
  src: string;
  label: string;
  className?: string;
  bare?: boolean;
}) {
  return (
    <figure data-clip className={`photo ${className}`}>
      {src ? (
        // Photos envoyées par le client, servies par /api/media : next/image n'apporte rien ici.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} loading="lazy" decoding="async" />
      ) : (
        <div className="photo-empty" data-variant={[...label].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 3} aria-hidden="true">
          {!bare && (
            <>
              <span>Photo</span>
              <span>{label}</span>
            </>
          )}
        </div>
      )}
    </figure>
  );
}
