import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export const statusLabel = {
  interested: "Interested",
  not_interested: "Not interested",
  follow_up_required: "Follow-up required",
};

export const statusStyle = {
  interested: "border-emerald-200 bg-emerald-50 text-emerald-800",
  not_interested: "border-rose-200 bg-rose-50 text-rose-800",
  follow_up_required: "border-amber-200 bg-amber-50 text-amber-800",
};

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50";

export const Metric = ({ label, value, note }) => (
  <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-black tracking-tight text-ink">{value ?? 0}</p>
    {note && <p className="mt-1 text-xs leading-relaxed text-muted">{note}</p>}
  </article>
);

export const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-black text-ink">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
  </label>
);

export const PageHeader = ({ title, volunteerMode, scope, user }) => {
  const accessLabel = scope === "team" ? "Team workspace" : scope === "attendance" ? "Attendance workspace" : `Assigned to ${user?.name || "you"}`;
  return (
    <header className="mb-6 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-white via-white to-primary/5 p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
            <ShieldCheck size={14} /> Responsible relationship management
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {volunteerMode
              ? "Review assigned people, record dated remarks, and keep every next action accountable."
              : "Manage consent-aware registration, accountable follow-up, and session-level attendance from one secure workspace."}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Access scope</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-black text-ink"><span className="h-2 w-2 rounded-full bg-emerald-500" />{accessLabel}</p>
        </div>
      </div>
    </header>
  );
};

export const TabNavigation = ({ tabs, active, onChange }) => (
  <nav aria-label="Outreach sections" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
    {tabs.map(([key, label, Icon]) => (
      <button
        type="button"
        key={key}
        aria-current={active === key ? "page" : undefined}
        onClick={() => onChange(key)}
        className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${active === key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-ink"}`}
      >
        <Icon size={16} />{label}
      </button>
    ))}
  </nav>
);

export const NoticeBanner = ({ message }) => message ? (
  <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 shadow-sm">
    <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
    <span>{message}</span>
  </div>
) : null;

export const ErrorBanner = ({ message }) => message ? (
  <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
    <AlertCircle className="mt-0.5 shrink-0" size={18} />
    <span>{message}</span>
  </div>
) : null;
