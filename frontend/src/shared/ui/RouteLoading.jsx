export const RouteLoading = () => (
  <div className="grid min-h-[60vh] place-items-center px-6" role="status" aria-live="polite" aria-label="Loading page">
    <div className="w-full max-w-sm rounded-3xl border border-black/5 bg-white p-8 text-center shadow-premium">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
        <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary/25 border-t-primary" aria-hidden="true" />
      </div>
      <p className="font-display text-xl font-bold text-ink">Preparing your experience</p>
      <p className="mt-2 text-sm text-muted">Loading only the resources needed for this page.</p>
    </div>
  </div>
);
