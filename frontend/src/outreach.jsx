import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  ChevronRight,
  Clock,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { apiFetch } from "./api";
import { useAuth } from "./AuthContext";

const statusLabel = {
  interested: "Interested",
  not_interested: "Not interested",
  follow_up_required: "Follow-up required",
};
const statusStyle = {
  interested: "bg-emerald-100 text-emerald-800",
  not_interested: "bg-rose-100 text-rose-800",
  follow_up_required: "bg-amber-100 text-amber-800",
};
const input =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary";
const button =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-white disabled:opacity-50";
const emptyContact = {
  fullName: "",
  primaryPhone: "",
  email: "",
  occupation: "",
  registrationDate: new Date().toISOString().slice(0, 10),
  registrationSource: "",
  locality: "",
  preferredLanguage: "",
  permissionToContact: false,
  ageGroup: "",
};

const Metric = ({ label, value, note }) => (
  <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
    <p className="text-xs font-black uppercase tracking-wide text-muted">
      {label}
    </p>
    <p className="mt-2 text-3xl font-black text-ink">{value ?? 0}</p>
    {note && <p className="mt-1 text-xs text-muted">{note}</p>}
  </div>
);
const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-black text-ink">{label}</span>
    {children}
  </label>
);

export default function OutreachPage({ volunteerMode = false }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [meta, setMeta] = useState({
    volunteers: [],
    programs: [],
    sessions: [],
    scope: "assigned",
  });
  const [dashboard, setDashboard] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(null);
  const [form, setForm] = useState(emptyContact);
  const [follow, setFollow] = useState({
    channel: "phone_call",
    remarks: "",
    nextFollowUpDate: "",
  });
  const [followRegister, setFollowRegister] = useState({
    from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    listStatus: "current",
    contacts: [],
    followUps: [],
  });
  const [rangeAssign, setRangeAssign] = useState({
    from: "",
    to: "",
    volunteer: "",
  });
  const [invite, setInvite] = useState({
    session: "",
    confirmation: "pending",
  });
  const [attendance, setAttendance] = useState({
    programName: "",
    program: "",
    startsAt: "",
    title: "",
    date: new Date().toISOString().slice(0, 10),
    session: "",
    search: "",
    sheet: null,
    entries: [],
  });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const tell = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 5000);
  };
  const loadMeta = () => apiFetch("/outreach/meta").then(setMeta);
  const loadDashboard = () =>
    apiFetch("/outreach/dashboard").then(setDashboard);
  const loadContacts = () =>
    apiFetch(
      `/outreach/contacts?limit=100&search=${encodeURIComponent(search)}`,
    ).then((d) => setContacts(d.items || []));
  const refresh = () =>
    Promise.all([loadMeta(), loadDashboard(), loadContacts()]).catch((e) =>
      tell(e.message),
    );
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(
      () => loadContacts().catch((e) => tell(e.message)),
      250,
    );
    return () => clearTimeout(timer);
  }, [search]);

  const openContact = async (contact) => {
    setSelected(contact);
    setHistory(null);
    try {
      setHistory(await apiFetch(`/outreach/contacts/${contact._id}`));
    } catch (e) {
      tell(e.message);
    }
  };
  const register = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const dup = await apiFetch(
        `/outreach/contacts/duplicates?name=${encodeURIComponent(form.fullName)}&phone=${encodeURIComponent(form.primaryPhone)}`,
      );
      if (
        dup.items?.length &&
        !window.confirm(
          `${dup.items.length} possible duplicate(s) found. Save this as a separate person anyway?`,
        )
      )
        return;
      const data = await apiFetch("/outreach/contacts", {
        method: "POST",
        body: form,
      });
      tell(data.message);
      setForm(emptyContact);
      setTab("contacts");
      await refresh();
    } catch (e2) {
      tell(e2.message);
    } finally {
      setBusy(false);
    }
  };
  const assign = async (volunteer) => {
    if (!volunteer) return;
    try {
      const d = await apiFetch(`/outreach/contacts/${selected._id}/assign`, {
        method: "POST",
        body: { volunteer },
      });
      tell(d.message);
      await refresh();
      setSelected(null);
    } catch (e) {
      tell(e.message);
    }
  };
  const addFollowUp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await apiFetch(
        `/outreach/contacts/${selected._id}/follow-ups`,
        {
          method: "POST",
          body: { ...follow, interactedAt: new Date().toISOString() },
        },
      );
      tell(
        `${d.message} Automatic result: ${statusLabel[d.item.interestStatus]}.`,
      );
      setFollow({ channel: "phone_call", remarks: "", nextFollowUpDate: "" });
      await openContact(selected);
      await refresh();
    } catch (e2) {
      tell(e2.message);
    } finally {
      setBusy(false);
    }
  };
  const addInvitation = async () => {
    try {
      await apiFetch("/outreach/invitations", {
        method: "POST",
        body: { contact: selected._id, ...invite },
      });
      tell("Invitation recorded separately from attendance.");
      setInvite({ session: "", confirmation: "pending" });
      await openContact(selected);
    } catch (e) {
      tell(e.message);
    }
  };
  const createProgram = async () => {
    try {
      await apiFetch("/outreach/programs", {
        method: "POST",
        body: { name: attendance.programName },
      });
      setAttendance((x) => ({ ...x, programName: "" }));
      await loadMeta();
      tell("Program created.");
    } catch (e) {
      tell(e.message);
    }
  };
  const createSession = async () => {
    try {
      await apiFetch("/outreach/sessions", {
        method: "POST",
        body: {
          program: attendance.program,
          startsAt: attendance.startsAt,
          title: attendance.title,
        },
      });
      await loadMeta();
      tell("Session created.");
    } catch (e) {
      tell(e.message);
    }
  };
  const createSheet = async () => {
    try {
      const d = await apiFetch("/outreach/attendance-sheets", {
        method: "POST",
        body: { session: attendance.session },
      });
      const full = await apiFetch(`/outreach/attendance-sheets/${d.sheet._id}`);
      setAttendance((x) => ({
        ...x,
        sheet: full.sheet,
        entries: full.entries,
      }));
      tell(d.message);
    } catch (e) {
      tell(e.message);
    }
  };
  const mark = async (contactId, status) => {
    try {
      await apiFetch(
        `/outreach/attendance-sheets/${attendance.sheet._id}/entries/${contactId}`,
        { method: "PUT", body: { status } },
      );
      setAttendance((x) => ({
        ...x,
        entries: x.entries.map((entry) =>
          entry.contact?._id === contactId ? { ...entry, status } : entry,
        ),
      }));
    } catch (e) {
      tell(e.message);
    }
  };
  const finalize = async () => {
    try {
      const unmarked = attendance.entries.filter(
        (x) => x.status === "unmarked",
      ).length;
      const d = await apiFetch(
        `/outreach/attendance-sheets/${attendance.sheet._id}/finalize`,
        {
          method: "POST",
          body: {
            confirmUnmarked: unmarked
              ? window.confirm(
                  `${unmarked} entries remain unmarked. Finalize without treating them as absent?`,
                )
              : true,
          },
        },
      );
      setAttendance((x) => ({ ...x, sheet: d.sheet }));
      tell(d.message);
      await loadDashboard();
    } catch (e) {
      tell(e.message);
    }
  };

  const tabs = useMemo(
    () =>
      volunteerMode
        ? [
            ["follow-register", "Follow-up register", CalendarCheck],
            ["contacts", "My contacts", Users],
          ]
        : [
            ["dashboard", "Dashboard", BarChart3],
            ["register", "Register", UserPlus],
            ["follow-register", "Follow-up register", CalendarCheck],
            ["contacts", "Directory", Users],
            ["attendance", "Attendance", Clock],
          ],
    [volunteerMode],
  );
  const interestTotal = dashboard
    ? Object.values(dashboard.interest || {}).reduce((a, b) => a + b, 0)
    : 0;
  const sessionsForDate = meta.sessions
    .filter((session) => {
      const local = new Date(session.startsAt);
      const key = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
      return key === attendance.date;
    })
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const visibleAttendance = attendance.entries.filter(
    (entry) =>
      !attendance.search ||
      `${entry.contact?.fullName} ${entry.contact?.primaryPhone}`
        .toLowerCase()
        .includes(attendance.search.toLowerCase()),
  );
  const loadFollowRegister = async (overrides = {}) => {
    const query = { ...followRegister, ...overrides };
    try {
      const data = await apiFetch(
        `/outreach/follow-up-register?from=${query.from}&to=${query.to}&listStatus=${query.listStatus}`,
      );
      setFollowRegister((current) => ({
        ...current,
        ...overrides,
        contacts: data.contacts || [],
        followUps: data.followUps || [],
      }));
    } catch (e) {
      tell(e.message);
    }
  };
  useEffect(() => {
    if (tab === "follow-register") loadFollowRegister();
  }, [tab]);
  const registerDates = useMemo(() => {
    const result = [];
    const cursor = new Date(`${followRegister.from}T00:00:00`);
    const end = new Date(`${followRegister.to}T00:00:00`);
    while (cursor <= end && result.length < 31) {
      result.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [followRegister.from, followRegister.to]);
  const assignRange = async () => {
    try {
      const data = await apiFetch("/outreach/assign-range", {
        method: "POST",
        body: { ...rangeAssign, listStatus: followRegister.listStatus },
      });
      tell(data.message);
      await loadFollowRegister();
    } catch (e) {
      tell(e.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-primary">
            Relationship-centred outreach
          </p>
          <h1 className="text-3xl font-black text-ink">
            {volunteerMode ? "My follow-ups" : "Youth Outreach CRM"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Registration, responsible follow-up and verified attendance remain
            separate records.
          </p>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-ink shadow-sm">
          {meta.scope === "team" ? "Team scope" : `Assigned to ${user?.name}`}
        </span>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${tab === key ? "bg-primary text-white" : "text-muted hover:bg-soft"}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {notice && (
        <div className="mb-5 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white">
          {notice}
        </div>
      )}

      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Registered contacts"
              value={dashboard?.registration?.total}
            />
            <Metric
              label="New in 30 days"
              value={dashboard?.registration?.newInRange}
            />
            <Metric
              label="Overdue follow-ups"
              value={dashboard?.followUp?.overdue}
              note="Based only on scheduled next actions"
            />
            <Metric
              label="Verified present"
              value={dashboard?.attendance?.present}
              note="Finalized sheets in selected period"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Three interest statuses</h2>
              <div className="mt-5 space-y-4">
                {[
                  ["interested", dashboard?.interest?.interested],
                  ["follow_up_required", dashboard?.interest?.followUpRequired],
                  ["not_interested", dashboard?.interest?.notInterested],
                ].map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-sm font-bold">
                      <span>{statusLabel[key]}</span>
                      <span>{value || 0}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-soft">
                      <div
                        className={`h-full ${key === "interested" ? "bg-emerald-500" : key === "not_interested" ? "bg-rose-500" : "bg-amber-500"}`}
                        style={{
                          width: `${interestTotal ? ((value || 0) / interestTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Follow-up funnel</h2>
              <p className="text-xs text-muted">
                Sequential records, not a claim of causation.
              </p>
              <div className="mt-4 space-y-2">
                {dashboard?.funnel?.map((step) => (
                  <div
                    key={step.label}
                    className="flex items-center justify-between rounded-xl bg-soft/60 px-4 py-3"
                  >
                    <span className="text-sm font-bold">{step.label}</span>
                    <span className="text-sm font-black">
                      {step.value}{" "}
                      <small className="text-muted">({step.conversion}%)</small>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === "register" && (
        <form
          onSubmit={register}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-black">Register a contact</h2>
          <p className="mb-5 text-sm text-muted">
            Only collect what is useful for agreed outreach. Possible duplicates
            are shown for human review.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name *">
              <input
                className={input}
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>
            <Field label="Primary contact number *">
              <input
                className={input}
                required
                value={form.primaryPhone}
                onChange={(e) =>
                  setForm({ ...form, primaryPhone: e.target.value })
                }
              />
            </Field>
            <Field label="Email *">
              <input
                type="email"
                className={input}
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Occupation *">
              <input
                className={input}
                required
                placeholder="Student, engineer, business…"
                value={form.occupation}
                onChange={(e) =>
                  setForm({ ...form, occupation: e.target.value })
                }
              />
            </Field>
            <Field label="Registration date *">
              <input
                type="date"
                className={input}
                required
                value={form.registrationDate}
                onChange={(e) =>
                  setForm({ ...form, registrationDate: e.target.value })
                }
              />
            </Field>
            <Field label="Registration source *">
              <input
                className={input}
                required
                placeholder="Youth program, lecture, referral…"
                value={form.registrationSource}
                onChange={(e) =>
                  setForm({ ...form, registrationSource: e.target.value })
                }
              />
            </Field>
            <Field label="Locality">
              <input
                className={input}
                value={form.locality}
                onChange={(e) => setForm({ ...form, locality: e.target.value })}
              />
            </Field>
            <Field label="Age group">
              <select
                className={input}
                value={form.ageGroup}
                onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
              >
                <option value="">Not collected</option>
                <option value="minor">Minor</option>
                <option>18-24</option>
                <option>25-34</option>
                <option>35-44</option>
                <option>45+</option>
              </select>
            </Field>
          </div>
          {form.ageGroup === "minor" && (
            <label className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900">
              <input
                type="checkbox"
                required
                checked={form.guardianConsentConfirmed || false}
                onChange={(e) =>
                  setForm({
                    ...form,
                    guardianConsentConfirmed: e.target.checked,
                  })
                }
              />
              Approved guardian consent and safeguarding rules have been
              completed.
            </label>
          )}
          <label className="mt-4 flex items-start gap-3 rounded-xl bg-soft p-4 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.permissionToContact}
              onChange={(e) =>
                setForm({ ...form, permissionToContact: e.target.checked })
              }
            />
            The person has given permission to receive follow-up communications.
          </label>
          <button disabled={busy} className={`${button} mt-5`}>
            <Plus size={16} />
            Register contact
          </button>
        </form>
      )}

      {tab === "contacts" && (
        <section className="rounded-2xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 p-5">
            <div>
              <h2 className="text-xl font-black">
                {volunteerMode ? "Assigned contacts" : "Outreach directory"}
              </h2>
              <p className="text-xs text-muted">
                {contacts.length} visible record(s)
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-muted" size={16} />
              <input
                className={`${input} pl-9`}
                placeholder="Search name or contact"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="divide-y divide-black/5">
            {contacts.map((contact) => (
              <button
                key={contact._id}
                onClick={() => openContact(contact)}
                className="grid w-full gap-2 px-5 py-4 text-left hover:bg-soft/40 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto]"
              >
                <span>
                  <b className="block text-ink">{contact.fullName}</b>
                  <small className="text-muted">{contact.primaryPhone}</small>
                </span>
                <span
                  className={`w-fit self-center rounded-full px-2.5 py-1 text-[11px] font-black ${statusStyle[contact.interestStatus]}`}
                >
                  {statusLabel[contact.interestStatus]}
                </span>
                <span className="self-center text-xs text-muted">
                  {contact.currentVolunteer?.name || "Unassigned"}
                </span>
                <span
                  className={`self-center text-xs font-bold ${contact.nextFollowUpDate && new Date(contact.nextFollowUpDate) < new Date() ? "text-rose-600" : "text-muted"}`}
                >
                  {contact.nextFollowUpDate
                    ? new Date(contact.nextFollowUpDate).toLocaleDateString()
                    : "No next action"}
                </span>
                <ChevronRight className="self-center text-muted" size={18} />
              </button>
            ))}
            {!contacts.length && (
              <p className="p-10 text-center text-sm text-muted">
                No contacts match this view.
              </p>
            )}
          </div>
        </section>
      )}

      {tab === "follow-register" && (
        <section className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <Field label="From date">
                <input
                  type="date"
                  className={input}
                  value={followRegister.from}
                  onChange={(e) =>
                    setFollowRegister({
                      ...followRegister,
                      from: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="To date (maximum 31 days)">
                <input
                  type="date"
                  className={input}
                  value={followRegister.to}
                  onChange={(e) =>
                    setFollowRegister({ ...followRegister, to: e.target.value })
                  }
                />
              </Field>
              <Field label="List">
                <select
                  className={input}
                  value={followRegister.listStatus}
                  onChange={(e) =>
                    setFollowRegister({
                      ...followRegister,
                      listStatus: e.target.value,
                    })
                  }
                >
                  <option value="current">Current follow-up list</option>
                  <option value="non_follow_up">Non-follow-up list</option>
                </select>
              </Field>
              <button className={button} onClick={() => loadFollowRegister()}>
                Load register
              </button>
            </div>
            {meta.scope === "team" && (
              <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-black/5 pt-5">
                <Field label="Visible number from">
                  <input
                    type="number"
                    min="1"
                    className={input}
                    value={rangeAssign.from}
                    onChange={(e) =>
                      setRangeAssign({ ...rangeAssign, from: e.target.value })
                    }
                  />
                </Field>
                <Field label="Visible number to">
                  <input
                    type="number"
                    min="1"
                    className={input}
                    value={rangeAssign.to}
                    onChange={(e) =>
                      setRangeAssign({ ...rangeAssign, to: e.target.value })
                    }
                  />
                </Field>
                <Field label="Assign range to devotee">
                  <select
                    className={input}
                    value={rangeAssign.volunteer}
                    onChange={(e) =>
                      setRangeAssign({
                        ...rangeAssign,
                        volunteer: e.target.value,
                      })
                    }
                  >
                    <option value="">Choose devotee…</option>
                    {meta.volunteers.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <button
                  className={button}
                  disabled={
                    !rangeAssign.from ||
                    !rangeAssign.to ||
                    !rangeAssign.volunteer
                  }
                  onClick={assignRange}
                >
                  Assign number range
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-ink text-white">
                <tr>
                  <th className="sticky left-0 z-10 min-w-16 bg-ink px-3 py-3">
                    No.
                  </th>
                  <th className="sticky left-16 z-10 min-w-52 bg-ink px-3 py-3">
                    Registered person
                  </th>
                  <th className="min-w-32 px-3 py-3">Devotee</th>
                  <th className="min-w-24 px-3 py-3">Strikes</th>
                  {registerDates.map((date) => (
                    <th
                      key={date}
                      className="min-w-56 border-l border-white/10 px-3 py-3"
                    >
                      {new Date(`${date}T00:00:00`).toLocaleDateString([], {
                        day: "2-digit",
                        month: "short",
                        weekday: "short",
                      })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {followRegister.contacts.map((contact) => (
                  <tr
                    key={contact._id}
                    className="border-t border-black/5 align-top"
                  >
                    <td className="sticky left-0 bg-white px-3 py-3 font-black">
                      #{contact.listNumber}
                    </td>
                    <td className="sticky left-16 bg-white px-3 py-3">
                      <button
                        onClick={() => openContact(contact)}
                        className="text-left font-black text-primary hover:underline"
                      >
                        {contact.fullName}
                      </button>
                      <p className="font-normal text-muted">
                        {contact.primaryPhone}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {contact.currentVolunteer?.name || "Unassigned"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 font-black ${contact.strikeCount >= 3 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}
                      >
                        {contact.strikeCount || 0}/3
                      </span>
                    </td>
                    {registerDates.map((date) => {
                      const remarks = followRegister.followUps.filter(
                        (item) =>
                          item.contact === contact._id &&
                          new Date(item.interactedAt)
                            .toISOString()
                            .slice(0, 10) === date,
                      );
                      return (
                        <td
                          key={date}
                          className="border-l border-black/5 px-3 py-3"
                        >
                          {remarks.map((item) => (
                            <div
                              key={item._id}
                              className={`mb-2 rounded-lg p-2 ${item.sentiment === "interested" ? "bg-emerald-50 text-emerald-900" : item.sentiment === "not_interested" ? "bg-rose-50 text-rose-900" : "bg-amber-50 text-amber-900"}`}
                            >
                              <b className="block text-[10px] uppercase">
                                {statusLabel[item.interestStatus]}
                              </b>
                              {item.remarks}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!followRegister.contacts.length && (
                  <tr>
                    <td
                      colSpan={4 + registerDates.length}
                      className="p-10 text-center text-muted"
                    >
                      No contacts in this list.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="px-2 text-xs text-muted">
            Blank cell means no follow-up was recorded on that date. An unclear
            automatic result adds one strike. At 3/3 the person moves to the
            non-follow-up list.
          </p>
        </section>
      )}

      {tab === "attendance" && (
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-black">Take attendance</h2>
              <p className="text-sm text-muted">
                1. Choose the date. 2. Choose the exact program session. 3. Mark
                each registered person. A person may be present in multiple
                sessions on the same day.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-[240px_1fr_auto]">
              <Field label="1. Attendance date">
                <input
                  type="date"
                  className={input}
                  value={attendance.date}
                  onChange={(e) =>
                    setAttendance({
                      ...attendance,
                      date: e.target.value,
                      session: "",
                      sheet: null,
                      entries: [],
                    })
                  }
                />
              </Field>
              <Field label="2. Program session">
                <select
                  className={input}
                  value={attendance.session}
                  onChange={(e) =>
                    setAttendance({
                      ...attendance,
                      session: e.target.value,
                      sheet: null,
                      entries: [],
                    })
                  }
                >
                  <option value="">Choose a session on this date…</option>
                  {sessionsForDate.map((s) => (
                    <option key={s._id} value={s._id}>
                      {new Date(s.startsAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      — {s.program?.name}
                      {s.title ? ` — ${s.title}` : ""}
                    </option>
                  ))}
                </select>
                {!sessionsForDate.length && (
                  <span className="mt-1 block text-xs font-bold text-amber-700">
                    No sessions exist on this date. Create one below.
                  </span>
                )}
              </Field>
              <button
                type="button"
                disabled={!attendance.session}
                className={`${button} self-end`}
                onClick={createSheet}
              >
                Load registered people
              </button>
            </div>
          </section>
          {attendance.sheet && (
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black">Session attendance</h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${attendance.sheet.status === "finalized" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                    >
                      {attendance.sheet.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {
                      attendance.entries.filter((x) => x.status === "present")
                        .length
                    }{" "}
                    present ·{" "}
                    {
                      attendance.entries.filter((x) => x.status === "unmarked")
                        .length
                    }{" "}
                    not marked · {attendance.entries.length} registered
                  </p>
                </div>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-3 text-muted"
                    size={16}
                  />
                  <input
                    className={`${input} pl-9`}
                    placeholder="Search registered person"
                    value={attendance.search}
                    onChange={(e) =>
                      setAttendance({ ...attendance, search: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-5 divide-y divide-black/5 rounded-xl border border-black/5">
                {visibleAttendance.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <p className="text-sm font-black">
                        {entry.contact?.fullName}
                      </p>
                      <p className="text-xs text-muted">
                        {entry.contact?.primaryPhone || "No contact number"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {[
                        ["present", "Present"],
                        ["absent", "Absent"],
                        ["excused", "Excused"],
                        ["unmarked", "Clear"],
                      ].map(([status, label]) => (
                        <button
                          key={status}
                          disabled={attendance.sheet.status === "finalized"}
                          onClick={() => mark(entry.contact._id, status)}
                          className={`rounded-lg px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-60 ${entry.status === status ? (status === "present" ? "bg-emerald-600 text-white" : status === "absent" ? "bg-rose-600 text-white" : "bg-primary text-white") : "bg-soft text-muted"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!visibleAttendance.length && (
                  <p className="p-8 text-center text-sm text-muted">
                    No registered person matches the search.
                  </p>
                )}
              </div>
              {attendance.sheet.status !== "finalized" && (
                <button
                  className={`${button} mt-5 w-full sm:w-auto`}
                  onClick={finalize}
                >
                  <CalendarCheck size={16} />
                  Finalize this session
                </button>
              )}
            </section>
          )}
          <details className="rounded-2xl bg-white p-6 shadow-sm">
            <summary className="cursor-pointer text-sm font-black">
              Create a new program or session
            </summary>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-black">New program</h3>
                <div className="flex gap-2">
                  <input
                    className={input}
                    placeholder="Program name"
                    value={attendance.programName}
                    onChange={(e) =>
                      setAttendance({
                        ...attendance,
                        programName: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    className={button}
                    onClick={createProgram}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-black">New session</h3>
                <select
                  className={input}
                  value={attendance.program}
                  onChange={(e) =>
                    setAttendance({ ...attendance, program: e.target.value })
                  }
                >
                  <option value="">Choose program…</option>
                  {meta.programs.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  className={input}
                  placeholder="Session title, e.g. Morning lecture"
                  value={attendance.title}
                  onChange={(e) =>
                    setAttendance({ ...attendance, title: e.target.value })
                  }
                />
                <input
                  type="datetime-local"
                  className={input}
                  value={attendance.startsAt}
                  onChange={(e) =>
                    setAttendance({ ...attendance, startsAt: e.target.value })
                  }
                />
                <button
                  type="button"
                  className={button}
                  onClick={createSession}
                >
                  Create session
                </button>
              </div>
            </div>
          </details>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  #{selected.sequenceNumber || "—"} · {selected.fullName}
                </h2>
                <p className="text-sm text-muted">
                  {selected.primaryPhone} ·{" "}
                  {statusLabel[selected.interestStatus]} ·{" "}
                  {selected.strikeCount || 0}/3 strikes
                </p>
              </div>
              <button onClick={() => setSelected(null)}>
                <X />
              </button>
            </div>
            {meta.scope === "team" && (
              <Field label="Assigned volunteer">
                <select
                  className={`${input} mt-5`}
                  value={selected.currentVolunteer?._id || ""}
                  onChange={(e) => assign(e.target.value)}
                >
                  <option value="">Assign…</option>
                  {meta.volunteers.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.role})
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="mt-5 grid gap-3 rounded-2xl border border-black/5 bg-soft/40 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <b className="block text-[10px] uppercase text-muted">Email</b>
                {history?.item?.email || selected.email || "—"}
              </div>
              <div>
                <b className="block text-[10px] uppercase text-muted">
                  Occupation
                </b>
                {history?.item?.occupation || selected.occupation || "—"}
              </div>
              <div>
                <b className="block text-[10px] uppercase text-muted">
                  Locality
                </b>
                {history?.item?.locality || selected.locality || "—"}
              </div>
              <div>
                <b className="block text-[10px] uppercase text-muted">
                  Registration date
                </b>
                {new Date(
                  history?.item?.registrationDate || selected.registrationDate,
                ).toLocaleDateString()}
              </div>
              <div>
                <b className="block text-[10px] uppercase text-muted">
                  Registration source
                </b>
                {history?.item?.registrationSource ||
                  selected.registrationSource ||
                  "—"}
              </div>
              <div>
                <b className="block text-[10px] uppercase text-muted">
                  Preferred language
                </b>
                {history?.item?.preferredLanguage ||
                  selected.preferredLanguage ||
                  "—"}
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <form
                  onSubmit={addFollowUp}
                  className="space-y-4 rounded-2xl bg-soft/50 p-5"
                >
                  <div>
                    <h3 className="font-black">Dated follow-up remark</h3>
                    <p className="text-xs text-muted">
                      Enter the actual remark. Interest is analyzed
                      automatically and the three-strike rule is applied.
                    </p>
                  </div>
                  <Field label="Actual remark">
                    <textarea
                      required
                      className={`${input} min-h-32`}
                      placeholder="Example: No answer; call again Friday. Or: Interested and requested evening session details."
                      value={follow.remarks}
                      onChange={(e) =>
                        setFollow({ ...follow, remarks: e.target.value })
                      }
                    />
                  </Field>
                  <details>
                    <summary className="cursor-pointer text-xs font-black text-muted">
                      Optional follow-up details
                    </summary>
                    <div className="mt-3 grid gap-3">
                      <select
                        className={input}
                        value={follow.channel}
                        onChange={(e) =>
                          setFollow({ ...follow, channel: e.target.value })
                        }
                      >
                        <option value="phone_call">Phone call</option>
                        <option value="message">Message</option>
                        <option value="in_person">In person</option>
                        <option value="event_conversation">
                          Event conversation
                        </option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="date"
                        className={input}
                        value={follow.nextFollowUpDate}
                        onChange={(e) =>
                          setFollow({
                            ...follow,
                            nextFollowUpDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </details>
                  <button disabled={busy} className={`${button} w-full`}>
                    Analyze and save remark
                  </button>
                </form>
                <div className="mt-4 space-y-2 rounded-2xl border border-black/5 p-5">
                  <h3 className="font-black">Invite to a session</h3>
                  <select
                    className={input}
                    value={invite.session}
                    onChange={(e) =>
                      setInvite({ ...invite, session: e.target.value })
                    }
                  >
                    <option value="">Choose session…</option>
                    {meta.sessions.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.program?.name} —{" "}
                        {new Date(s.startsAt).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <select
                    className={input}
                    value={invite.confirmation}
                    onChange={(e) =>
                      setInvite({ ...invite, confirmation: e.target.value })
                    }
                  >
                    <option value="pending">Invited, awaiting reply</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                  </select>
                  <button
                    type="button"
                    disabled={!invite.session}
                    onClick={addInvitation}
                    className={`${button} w-full`}
                  >
                    Record invitation
                  </button>
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-black">Last 3 remarks</h3>
                <div className="space-y-3">
                  {history?.history?.followUps?.slice(0, 3).map((item) => (
                    <div
                      key={item._id}
                      className="rounded-xl border border-black/5 p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <b className="text-sm">
                          {statusLabel[item.interestStatus]}
                        </b>
                        <small className="text-muted">
                          {new Date(item.interactedAt).toLocaleString()}
                        </small>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-body">
                        {item.remarks}
                      </p>
                      <p className="mt-2 text-xs font-bold text-muted">
                        Recorded by {item.recordedBy?.name}
                      </p>
                    </div>
                  ))}
                  {history?.history?.invitations?.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm"
                    >
                      <b>Invited: {item.session?.program?.name}</b>
                      <p className="text-xs text-muted">
                        {item.confirmation} ·{" "}
                        {item.session?.startsAt
                          ? new Date(item.session.startsAt).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  ))}
                  {history &&
                    !history.history.followUps.length &&
                    !history.history.invitations.length && (
                      <p className="text-sm text-muted">
                        No activity recorded yet.
                      </p>
                    )}{" "}
                  {!history && (
                    <p className="text-sm text-muted">Loading history…</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
