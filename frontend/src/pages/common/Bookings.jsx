import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import { io } from "socket.io-client";
import { Check, X, Calendar, Clock, RefreshCw, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, Search, Globe2, Loader2, LogIn, LogOut, AlarmClockOff, FileClock, Shield, Send, Trash2, Edit3 } from "lucide-react";

// dayjs setup
dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(relativeTime);

/**
 * ==========================
 * Single-file Booking UI
 * React + TailwindCSS (+ axios, socket.io-client, dayjs)
 * ==========================
 *
 * Back-end endpoints expected (as provided):
 *   GET    /api/booking/availability/:designerId?date=YYYY-MM-DD&slotMinutes=60&buffer=0
 *   POST   /api/booking/bookings { designerId, startUtc, endUtc, meta }
 *   POST   /api/booking/bookings/:id/respond { accept, reason? }
 *   POST   /api/booking/bookings/:id/reschedule { newStartUtc, newEndUtc, note? }
 *   POST   /api/booking/bookings/:id/cancel { reason? }
 *   GET    /api/booking/bookings/mine
 *   GET    /api/booking/bookings/designer/:designerId?from&to&status
 *   POST   /api/booking/bookings/expire   // optional (cron/webhook)
 *
 * Auth:
 *   Adds Authorization: Bearer <token> header automatically from localStorage key `jwt` by default.
 *   You can override token/API base via the top-right Config panel.
 *
 * Roles supported visually:
 *   creator — can request, reschedule, cancel; sees their bookings
 *   designer — can accept/decline incoming, reschedule/cancel
 *   superadmin — can act as either for demo (toggle in Config)
 */

// ======= Config (feel free to tweak) =======
const DEFAULT_API_BASE = "/api/booking"; // same as app.use('/api/booking', bookingRoutes)
const DEFAULT_SOCKET_PATH = "/socket.io"; // if you use Socket.IO

// ======= Small UI kit (Tailwind) =======
const cx = (...c) => c.filter(Boolean).join(" ");

const Button = ({ className = "", variant = "primary", size = "md", icon: Icon, iconRight: IconR, children, ...rest }) => {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    outline: "border border-zinc-300 hover:bg-zinc-50 text-zinc-800",
    ghost: "hover:bg-zinc-100 text-zinc-800",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-xl",
    md: "px-4 py-2 text-sm rounded-2xl",
    lg: "px-5 py-3 text-base rounded-2xl",
  };
  return (
    <button
      className={cx("inline-flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-indigo-400", variants[variant], sizes[size], className)}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{children}</span>
      {IconR && <IconR className="h-4 w-4" />}
    </button>
  );
};

const Input = ({ className = "", ...props }) => (
  <input
    className={cx(
      "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-400",
      className
    )}
    {...props}
  />
);

const Select = ({ className = "", children, ...props }) => (
  <select
    className={cx(
      "w-full appearance-none rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-400",
      className
    )}
    {...props}
  >
    {children}
  </select>
);

const TextArea = ({ className = "", rows = 4, ...props }) => (
  <textarea
    rows={rows}
    className={cx(
      "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-400",
      className
    )}
    {...props}
  />
);

const Tag = ({ color = "zinc", children }) => (
  <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium", `bg-${color}-100 text-${color}-700`)}>{children}</span>
);

const Badge = ({ children }) => (
  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">{children}</span>
);

const Card = ({ className = "", children }) => (
  <div className={cx("rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm", className)}>{children}</div>
);

const Modal = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

const Empty = ({ icon: Icon = Search, title = "Nothing here", hint }) => (
  <div className="grid place-items-center rounded-3xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600">
    <Icon className="mb-2 h-8 w-8" />
    <div className="text-sm font-medium">{title}</div>
    {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
  </div>
);

const Spinner = ({ label }) => (
  <div className="flex items-center gap-2 text-sm text-zinc-600">
    <Loader2 className="h-4 w-4 animate-spin" />
    {label && <span>{label}</span>}
  </div>
);

// ======= API client =======
function useApi(config) {
  const [apiBase, setApiBase] = useState(() => localStorage.getItem("apiBase") || DEFAULT_API_BASE);
  const [token, setToken] = useState(() => localStorage.getItem("jwt") || "");

  const client = useMemo(() => {
    const inst = axios.create({ baseURL: apiBase });
    inst.interceptors.request.use((cfg) => {
      const t = token || localStorage.getItem("jwt");
      if (t) cfg.headers.Authorization = `Bearer ${t}`;
      return cfg;
    });
    return inst;
  }, [apiBase, token]);

  return { client, apiBase, setApiBase, token, setToken };
}

// ======= Booking helpers =======
const statusColors = {
  pending: "amber",
  accepted: "emerald",
  declined: "rose",
  canceled: "rose",
  expired: "zinc",
  completed: "indigo",
};

function StatusPill({ s }) {
  const color = statusColors[s] || "zinc";
  return <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium", `bg-${color}-100 text-${color}-700`)}>{s}</span>;
}

function fmt(dt) {
  try {
    return dayjs.utc(dt).local().format("ddd, MMM D • HH:mm");
  } catch {
    return String(dt);
  }
}

// ======= Main component =======
export default function BookingPage() {
  const { client, apiBase, setApiBase, token, setToken } = useApi();

  // You may already know the logged-in user from your app; for demo, allow manual input
  const [me, setMe] = useState(() => {
    const cached = localStorage.getItem("me");
    return cached ? JSON.parse(cached) : { _id: "", role: "creator", name: "" };
  });

  const [designerId, setDesignerId] = useState("");
  const [date, setDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [buffer, setBuffer] = useState(0);
  const [availability, setAvailability] = useState({ loading: false, slots: [], tz: "" });

  const [projectTitle, setProjectTitle] = useState("");
  const [notes, setNotes] = useState("");

  const [myBookings, setMyBookings] = useState({ loading: false, data: [] });

  const [resched, setResched] = useState({ open: false, booking: null, target: null, loading: false });
  const [resp, setResp] = useState({ open: false, booking: null, accept: true, reason: "", loading: false });
  const [cancelM, setCancelM] = useState({ open: false, booking: null, reason: "", loading: false });

  const [socketEnabled, setSocketEnabled] = useState(true);
  const socketRef = useRef(null);

  // ===== Socket.IO (optional, will noop if server not configured) =====
  useEffect(() => {
    if (!socketEnabled) return;
    try {
      const url = window.location.origin; // same origin by default
      const s = io(url, { path: DEFAULT_SOCKET_PATH, withCredentials: true, autoConnect: true });
      socketRef.current = s;
      s.on("connect", () => console.log("socket connected"));
      s.on("booking:updated", (payload) => {
        // Optimistically refresh booking list
        fetchMyBookings();
      });
      s.on("booking:requested", () => fetchMyBookings());
      return () => s.disconnect();
    } catch (e) {
      console.warn("Socket disabled:", e?.message || e);
    }
  }, [socketEnabled]);

  // ===== Availability =====
  const loadAvailability = async () => {
    if (!designerId || !date) return;
    setAvailability((s) => ({ ...s, loading: true }));
    try {
      const { data } = await client.get(`/availability/${designerId}`, {
        params: { date, slotMinutes, buffer },
      });
      setAvailability({ loading: false, slots: data.slots || [], tz: data.tz });
    } catch (e) {
      console.error(e);
      setAvailability({ loading: false, slots: [], tz: "" });
    }
  };

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designerId, date, slotMinutes, buffer]);

  // ===== My bookings =====
  const fetchMyBookings = async () => {
    setMyBookings((s) => ({ ...s, loading: true }));
    try {
      const { data } = await client.get("/bookings/mine");
      setMyBookings({ loading: false, data });
    } catch (e) {
      console.error(e);
      setMyBookings({ loading: false, data: [] });
    }
  };

  useEffect(() => {
    fetchMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Actions =====
  const requestBooking = async (slot) => {
    if (!designerId) return alert("Designer ID is required");
    try {
      const payload = {
        designerId,
        startUtc: slot.startUtc || slot.start || slot.startUTC || slot.startUtc,
        endUtc: slot.endUtc || slot.end || slot.endUTC || slot.endUtc,
        meta: { projectTitle, notes },
      };
      await client.post("/bookings", payload);
      setProjectTitle("");
      setNotes("");
      fetchMyBookings();
      alert("Booking requested");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  const respondBooking = async () => {
    const b = resp.booking;
    if (!b) return;
    try {
      setResp((s) => ({ ...s, loading: true }));
      await client.post(`/bookings/${b._id}/respond`, { accept: resp.accept, reason: resp.accept ? undefined : resp.reason });
      setResp({ open: false, booking: null, accept: true, reason: "", loading: false });
      fetchMyBookings();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
      setResp((s) => ({ ...s, loading: false }));
    }
  };

  const openReschedule = (b) => setResched({ open: true, booking: b, target: null, loading: false });

  const performReschedule = async () => {
    const { booking, target } = resched;
    if (!booking || !target) return;
    try {
      setResched((s) => ({ ...s, loading: true }));
      await client.post(`/bookings/${booking._id}/reschedule`, {
        newStartUtc: target.startUtc || target.start,
        newEndUtc: target.endUtc || target.end,
        note: `Rescheduled via UI from ${fmt(booking.startUtc)}–${fmt(booking.endUtc)}`,
      });
      setResched({ open: false, booking: null, target: null, loading: false });
      fetchMyBookings();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
      setResched((s) => ({ ...s, loading: false }));
    }
  };

  const cancelBooking = async () => {
    const b = cancelM.booking;
    if (!b) return;
    try {
      setCancelM((s) => ({ ...s, loading: true }));
      await client.post(`/bookings/${b._id}/cancel`, { reason: cancelM.reason });
      setCancelM({ open: false, booking: null, reason: "", loading: false });
      fetchMyBookings();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
      setCancelM((s) => ({ ...s, loading: false }));
    }
  };

  // ===== Derived =====
  const upcoming = useMemo(() => myBookings.data.filter((b) => dayjs(b.endUtc).isAfter(dayjs()) ).sort((a,b)=> dayjs(a.startUtc).valueOf()-dayjs(b.startUtc).valueOf()), [myBookings]);
  const past = useMemo(() => myBookings.data.filter((b) => dayjs(b.endUtc).isBefore(dayjs()) ).sort((a,b)=> dayjs(b.startUtc).valueOf()-dayjs(a.startUtc).valueOf()), [myBookings]);

  const isDesigner = me.role === "designer" || me.role === "superadmin";
  const isCreator = me.role === "creator" || me.role === "superadmin";

  // Persist lightweight config
  useEffect(() => localStorage.setItem("apiBase", apiBase), [apiBase]);
  useEffect(() => localStorage.setItem("jwt", token), [token]);
  useEffect(() => localStorage.setItem("me", JSON.stringify(me)), [me]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white p-6">
      {/* Header */}
      <div className="mx-auto mb-6 flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
            <Badge>{apiBase}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-600">Fully dynamic, single-page booking system — React + Tailwind.</p>
        </div>

        {/* Quick config */}
        <Card className="sm:min-w-[420px]">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="API base" value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-zinc-500" />
              <span className="text-xs text-zinc-600">Local time: {dayjs().format("ddd MMM D, HH:mm")}</span>
            </div>
            <Input placeholder="JWT token" value={token} onChange={(e) => setToken(e.target.value)} />
            <Select value={me.role} onChange={(e) => setMe({ ...me, role: e.target.value })}>
              <option value="creator">creator</option>
              <option value="designer">designer</option>
              <option value="superadmin">superadmin</option>
            </Select>
            <Input placeholder="My userId (for display only)" value={me._id} onChange={(e) => setMe({ ...me, _id: e.target.value })} />
            <Input placeholder="My name (optional)" value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value })} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" /> <span>Auth header auto-attached</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Socket</span>
              <label className="inline-flex cursor-pointer items-center gap-1 text-zinc-700">
                <input type="checkbox" className="accent-indigo-600" checked={socketEnabled} onChange={(e) => setSocketEnabled(e.target.checked)} />
                <span>{socketEnabled ? "on" : "off"}</span>
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Layout: left (create) / right (list) */}
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[420px,1fr]">
        {/* Create / Availability */}
        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Find a slot</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Designer ID (ObjectId)" value={designerId} onChange={(e) => setDesignerId(e.target.value)} />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Select value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))}>
                {[30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </Select>
              <Select value={buffer} onChange={(e) => setBuffer(Number(e.target.value))}>
                {[0, 5, 10, 15, 30].map((b) => (
                  <option key={b} value={b}>buffer {b}m</option>
                ))}
              </Select>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Designer TZ (server): {availability.tz || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadAvailability}>Refresh</Button>
              </div>
            </div>

            <div className="mt-4">
              {availability.loading ? (
                <div className="grid place-items-center p-8"><Spinner label="Loading slots..." /></div>
              ) : availability.slots.length === 0 ? (
                <Empty title="No available slots" hint="Try another date or duration" />
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {availability.slots.map((s) => (
                    <button
                      key={s.startUtc}
                      onClick={() => requestBooking(s)}
                      className="rounded-2xl border border-zinc-200 bg-white p-3 text-left text-sm shadow-sm transition hover:shadow"
                    >
                      <div className="font-medium">{dayjs(s.startLocal).format("HH:mm")} – {dayjs(s.endLocal).format("HH:mm")}</div>
                      <div className="mt-1 text-[11px] text-zinc-500">UTC: {dayjs.utc(s.startUtc).format("HH:mm")}–{dayjs.utc(s.endUtc).format("HH:mm")}</div>
                      <div className="mt-2 text-[11px] text-emerald-700">Book this</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Booking details</h2>
            </div>
            <div className="space-y-3">
              <Input placeholder="Project title (optional)" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
              <TextArea rows={4} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <p className="text-xs text-zinc-500">Tip: click a slot above to send the request instantly.</p>
            </div>
          </Card>
        </div>

        {/* My bookings */}
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">My bookings</h2>
              {myBookings.loading ? <Spinner /> : (
                <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchMyBookings}>Refresh</Button>
              )}
            </div>

            {/* Upcoming */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                <ChevronDown className="h-4 w-4" /> Upcoming ({upcoming.length})
              </div>
              {upcoming.length === 0 ? (
                <Empty icon={FileClock} title="No upcoming bookings" />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((b) => (
                    <BookingRow
                      key={b._id}
                      b={b}
                      me={me}
                      onOpenRespond={(booking, accept) => setResp({ open: true, booking, accept, reason: "", loading: false })}
                      onOpenReschedule={openReschedule}
                      onOpenCancel={(booking) => setCancelM({ open: true, booking, reason: "", loading: false })}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Past */}
            <section className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                <ChevronDown className="h-4 w-4" /> Past ({past.length})
              </div>
              {past.length === 0 ? (
                <Empty icon={AlarmClockOff} title="No past bookings" />
              ) : (
                <div className="space-y-3">
                  {past.map((b) => (
                    <BookingRow
                      key={b._id}
                      b={b}
                      me={me}
                      onOpenRespond={(booking, accept) => setResp({ open: true, booking, accept, reason: "", loading: false })}
                      onOpenReschedule={openReschedule}
                      onOpenCancel={(booking) => setCancelM({ open: true, booking, reason: "", loading: false })}
                    />
                  ))}
                </div>
              )}
            </section>
          </Card>
        </div>
      </div>

      {/* Respond modal (designer) */}
      <Modal
        open={resp.open}
        title={resp.accept ? "Accept booking?" : "Decline booking"}
        onClose={() => setResp({ open: false, booking: null, accept: true, reason: "", loading: false })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResp({ open: false, booking: null, accept: true, reason: "", loading: false })}>Close</Button>
            <Button variant={resp.accept ? "success" : "danger"} icon={resp.accept ? Check : X} onClick={respondBooking} disabled={resp.loading}>
              {resp.accept ? "Accept" : "Decline"}
            </Button>
          </>
        }
      >
        {resp.booking && (
          <div className="space-y-2 text-sm">
            <div>
              <div className="text-zinc-600">When</div>
              <div className="font-medium">{fmt(resp.booking.startUtc)} – {fmt(resp.booking.endUtc)}</div>
            </div>
            {!resp.accept && (
              <TextArea placeholder="Reason (optional)" value={resp.reason} onChange={(e) => setResp((s) => ({ ...s, reason: e.target.value }))} />
            )}
          </div>
        )}
      </Modal>

      {/* Reschedule modal */}
      <Modal
        open={resched.open}
        title="Reschedule"
        onClose={() => setResched({ open: false, booking: null, target: null, loading: false })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResched({ open: false, booking: null, target: null, loading: false })}>Close</Button>
            <Button variant="warning" icon={RefreshCw} onClick={performReschedule} disabled={!resched.target || resched.loading}>Confirm move</Button>
          </>
        }
      >
        {resched.booking && (
          <ReschedulePicker
            client={client}
            booking={resched.booking}
            onSelect={(slot) => setResched((s) => ({ ...s, target: slot }))}
          />
        )}
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={cancelM.open}
        title="Cancel booking"
        onClose={() => setCancelM({ open: false, booking: null, reason: "", loading: false })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelM({ open: false, booking: null, reason: "", loading: false })}>Close</Button>
            <Button variant="danger" icon={Trash2} onClick={cancelBooking} disabled={cancelM.loading}>Cancel booking</Button>
          </>
        }
      >
        {cancelM.booking && (
          <div className="space-y-3 text-sm">
            <div className="text-zinc-600">This will notify both parties. You can optionally include a reason:</div>
            <TextArea placeholder="Reason (optional)" value={cancelM.reason} onChange={(e) => setCancelM((s) => ({ ...s, reason: e.target.value }))} />
            <div className="rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
              <div className="font-medium text-zinc-800">Current time</div>
              <div>{fmt(cancelM.booking.startUtc)} – {fmt(cancelM.booking.endUtc)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ===== Sub-components =====
function BookingRow({ b, me, onOpenRespond, onOpenReschedule, onOpenCancel }) {
  const mine = {
    iAmCreator: String(b.creator?._id || b.creator) === String(me._id),
    iAmDesigner: String(b.designer?._id || b.designer) === String(me._id),
  };
  const canRespond = mine.iAmDesigner && b.status === "pending";
  const canReschedule = ["pending", "accepted"].includes(b.status) && (mine.iAmDesigner || mine.iAmCreator);
  const canCancel = ["pending", "accepted"].includes(b.status) && (mine.iAmDesigner || mine.iAmCreator);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <StatusPill s={b.status} />
          <div className="font-medium text-zinc-800">{fmt(b.startUtc)} – {fmt(b.endUtc)}</div>
          {b.slotDuration && <Tag color="zinc">{b.slotDuration}m</Tag>}
          {b.meta?.projectTitle && <Tag color="indigo">{b.meta.projectTitle}</Tag>}
        </div>
        <div className="mt-1 truncate text-xs text-zinc-600">
          <span>Designer: {b.designer?.name || b.designer?.email || b.designer?._id || String(b.designer)}</span>
          <span className="mx-2">•</span>
          <span>Creator: {b.creator?.name || b.creator?.email || b.creator?._id || String(b.creator)}</span>
        </div>
        {b.reason && <div className="mt-1 text-xs text-rose-600">Reason: {b.reason}</div>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {canRespond && (
          <>
            <Button size="sm" variant="success" icon={Check} onClick={() => onOpenRespond(b, true)}>Accept</Button>
            <Button size="sm" variant="danger" icon={X} onClick={() => onOpenRespond(b, false)}>Decline</Button>
          </>
        )}
        {canReschedule && <Button size="sm" variant="warning" icon={RefreshCw} onClick={() => onOpenReschedule(b)}>Reschedule</Button>}
        {canCancel && <Button size="sm" variant="outline" icon={Trash2} onClick={() => onOpenCancel(b)}>Cancel</Button>}
      </div>
    </div>
  );
}

function ReschedulePicker({ client, booking, onSelect }) {
  const [date, setDate] = useState(() => dayjs(booking.startUtc).format("YYYY-MM-DD"));
  const [slots, setSlots] = useState([]);
  const [load, setLoad] = useState(false);

  const loadSlots = async () => {
    setLoad(true);
    try {
      const duration = dayjs(booking.endUtc).diff(dayjs(booking.startUtc), "minute");
      const { data } = await client.get(`/availability/${booking.designer?._id || booking.designer}`, {
        params: { date, slotMinutes: duration, buffer: 0 },
      });
      setSlots(data.slots || []);
    } catch (e) {
      console.error(e);
      setSlots([]);
    } finally {
      setLoad(false);
    }
  };

  useEffect(() => { loadSlots(); /* eslint-disable react-hooks/exhaustive-deps */ }, [date]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
        <Button variant="ghost" icon={ChevronLeft} onClick={() => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"))} />
        <div className="text-center text-sm font-medium">{dayjs(date).format("ddd, MMM D YYYY")}</div>
        <Button variant="ghost" iconRight={ChevronRight} onClick={() => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"))} />
      </div>
      {load ? (
        <div className="grid place-items-center p-6"><Spinner label="Loading slots..." /></div>
      ) : slots.length === 0 ? (
        <Empty title="No slots on this day" hint="Pick another date" />
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {slots.map((s) => (
            <button key={s.startUtc} onClick={() => onSelect(s)} className="rounded-2xl border border-zinc-200 p-3 text-left text-sm hover:bg-zinc-50">
              <div className="font-medium">{dayjs(s.startLocal).format("HH:mm")} – {dayjs(s.endLocal).format("HH:mm")}</div>
              <div className="mt-1 text-[11px] text-zinc-500">UTC {dayjs.utc(s.startUtc).format("HH:mm")}–{dayjs.utc(s.endUtc).format("HH:mm")}</div>
              <div className="mt-2 text-[11px] text-emerald-700">Move here</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
