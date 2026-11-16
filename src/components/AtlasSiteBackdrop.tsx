export default function AtlasSiteBackdrop() {
  return (
    <div className="atlas-site-backdrop" aria-hidden="true">
      <picture>
        <source media="(max-width: 767px)" srcSet="/atlas-cidade-noturna-mobile.webp" />
        <img src="/atlas-cidade-noturna.webp" alt="" width={1024} height={1536} fetchPriority="high" />
      </picture>
    </div>
  );
}
