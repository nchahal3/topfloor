"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  NotebookPen,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  CalendarRange,
} from "lucide-react";

type Direction = "long" | "short";

type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  direction: Direction;
  entry: number;
  exit: number;
  size: number;
  pnl: number;
  setup: string;
  notes: string;
};

const GREEN = "#00ff88";
const RED = "#ff4d4d";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const glass: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(0,255,136,0.07), rgba(0,255,136,0.015))",
  border: "1px solid rgba(0,255,136,0.16)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
  borderRadius: 18,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(0,255,136,0.18)",
  borderRadius: 10,
  color: "#f5f5f5",
  fontSize: 14,
  padding: "10px 12px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.6)",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 6,
  display: "block",
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const localYmd = (d: Date) => ymd(d.getFullYear(), d.getMonth(), d.getDate());
function money(v: number, cents = true) {
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  const abs = Math.abs(v);
  return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;
}

export default function TradingJournal({ userId }: { userId: string }) {
  const storageKey = `tf-journal-${userId}`;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [view, setView] = useState<"daily" | "monthly">("monthly");
  const [today, setToday] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [cal, setCal] = useState<{ y: number; m: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // form state
  const [fDate, setFDate] = useState("");
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<Direction>("long");
  const [fEntry, setFEntry] = useState("");
  const [fExit, setFExit] = useState("");
  const [size, setSize] = useState("");
  const [fPnl, setFPnl] = useState("");
  const [setup, setSetup] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setEntries(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    const t = localYmd(new Date());
    setToday(t);
    setSelectedDate(t);
    const now = new Date();
    setCal({ y: now.getFullYear(), m: now.getMonth() });
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries, loaded, storageKey]);

  // ----- derived totals -----
  const byDay = useMemo(() => {
    const m: Record<string, { pnl: number; count: number }> = {};
    for (const e of entries) {
      if (!m[e.date]) m[e.date] = { pnl: 0, count: 0 };
      m[e.date].pnl += e.pnl;
      m[e.date].count += 1;
    }
    return m;
  }, [entries]);

  const summary = useMemo(() => {
    const n = entries.length;
    const net = entries.reduce((a, b) => a + b.pnl, 0);
    const wins = entries.filter((e) => e.pnl > 0).length;
    const winRate = n ? Math.round((wins / n) * 100) : 0;

    let weekStr0 = "", weekStr1 = "", monthPrefix = "";
    if (today) {
      const now = new Date(today + "T00:00:00");
      const ws = new Date(now);
      ws.setDate(now.getDate() - now.getDay());
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      weekStr0 = localYmd(ws);
      weekStr1 = localYmd(we);
      monthPrefix = today.slice(0, 7);
    }
    const week = entries.filter((e) => e.date >= weekStr0 && e.date <= weekStr1).reduce((a, b) => a + b.pnl, 0);
    const month = entries.filter((e) => e.date.startsWith(monthPrefix)).reduce((a, b) => a + b.pnl, 0);
    return { n, net, winRate, week, month };
  }, [entries, today]);

  const calData = useMemo(() => {
    if (!cal) return null;
    const first = new Date(cal.y, cal.m, 1);
    const startPad = first.getDay();
    const daysIn = new Date(cal.y, cal.m + 1, 0).getDate();
    const cells: ({ day: number; date: string } | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysIn; d++) cells.push({ day: d, date: ymd(cal.y, cal.m, d) });
    const monthPrefix = `${cal.y}-${pad(cal.m + 1)}`;
    const monthTotal = entries.filter((e) => e.date.startsWith(monthPrefix)).reduce((a, b) => a + b.pnl, 0);
    const monthTrades = entries.filter((e) => e.date.startsWith(monthPrefix)).length;
    return { cells, monthTotal, monthTrades };
  }, [cal, entries]);

  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate).sort((a, b) => b.id.localeCompare(a.id)),
    [entries, selectedDate],
  );
  const dayTotal = dayEntries.reduce((a, b) => a + b.pnl, 0);

  const computedPnl = useMemo(() => {
    const e = parseFloat(fEntry), x = parseFloat(fExit), s = parseFloat(size);
    if (isNaN(e) || isNaN(x) || isNaN(s)) return null;
    return Math.round((x - e) * s * (direction === "long" ? 1 : -1) * 100) / 100;
  }, [fEntry, fExit, size, direction]);

  // ----- actions -----
  function openModal() {
    setFDate(selectedDate || today);
    setSymbol(""); setDirection("long"); setFEntry(""); setFExit(""); setSize(""); setFPnl(""); setSetup(""); setNotes("");
    setModalOpen(true);
  }
  function addEntry(ev: React.FormEvent) {
    ev.preventDefault();
    if (!symbol.trim()) return;
    const manual = parseFloat(fPnl);
    const finalPnl = fPnl !== "" && !isNaN(manual) ? manual : computedPnl ?? 0;
    const next: Entry = {
      id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      date: fDate || today,
      symbol: symbol.trim().toUpperCase(),
      direction,
      entry: parseFloat(fEntry) || 0,
      exit: parseFloat(fExit) || 0,
      size: parseFloat(size) || 0,
      pnl: finalPnl,
      setup: setup.trim(),
      notes: notes.trim(),
    };
    setEntries((e) => [next, ...e]);
    setModalOpen(false);
  }
  function remove(id: string) {
    setEntries((e) => e.filter((x) => x.id !== id));
  }
  function stepMonth(dir: number) {
    setCal((c) => {
      if (!c) return c;
      const d = new Date(c.y, c.m + dir, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }
  function stepDay(dir: number) {
    if (!selectedDate) return;
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + dir);
    setSelectedDate(localYmd(d));
  }
  function prettyDate(iso: string) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div className="relative mx-auto max-w-[1000px] px-5 py-8 sm:px-8 sm:py-10">
      {/* ambient green glow behind the glass */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(620px 320px at 15% -5%, rgba(0,255,136,0.10), transparent), radial-gradient(560px 320px at 95% 25%, rgba(0,255,136,0.07), transparent)",
        }}
      />

      <div style={{ position: "relative" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 26 }}>
          <div>
            <p style={{ color: GREEN, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
              Tools &amp; Events
            </p>
            <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 40, margin: 0, lineHeight: 1, display: "flex", alignItems: "center", gap: 12 }}>
              <NotebookPen size={30} style={{ color: GREEN }} />
              Trading Journal
            </h1>
          </div>
          <button onClick={openModal} style={addBtnStyle}>
            <Plus size={16} /> Add Trade
          </button>
        </div>

        {/* summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 22 }}>
          <Stat label="This Week" value={money(summary.week)} color={pnlColor(summary.week)} glassy />
          <Stat label="This Month" value={money(summary.month)} color={pnlColor(summary.month)} glassy />
          <Stat label="Win Rate" value={`${summary.winRate}%`} color="#f5f5f5" />
          <Stat label="Net P&L" value={money(summary.net)} color={pnlColor(summary.net)} />
        </div>

        {/* view toggle */}
        <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, ...glass, marginBottom: 18 }}>
          <Toggle active={view === "monthly"} onClick={() => setView("monthly")} icon={<CalendarRange size={15} />} label="Monthly" />
          <Toggle active={view === "daily"} onClick={() => setView("daily")} icon={<CalendarDays size={15} />} label="Daily" />
        </div>

        {/* ---- MONTHLY VIEW: calendar ---- */}
        {view === "monthly" && cal && calData && (
          <div style={{ ...glass, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <NavBtn onClick={() => stepMonth(-1)}><ChevronLeft size={18} /></NavBtn>
                <span style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 17, minWidth: 150, textAlign: "center" }}>
                  {MONTHS[cal.m]} {cal.y}
                </span>
                <NavBtn onClick={() => stepMonth(1)}><ChevronRight size={18} /></NavBtn>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 8 }}>
                  Month
                </span>
                <span style={{ color: pnlColor(calData.monthTotal), fontWeight: 700, fontSize: 18 }}>{money(calData.monthTotal)}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {DOW.map((d) => (
                <div key={d} style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, padding: "4px 0" }}>
                  {d}
                </div>
              ))}
              {calData.cells.map((c, i) => {
                if (!c) return <div key={`e${i}`} />;
                const info = byDay[c.date];
                const has = !!info;
                const positive = has && info.pnl >= 0;
                const isToday = c.date === today;
                return (
                  <button
                    key={c.date}
                    onClick={() => { setSelectedDate(c.date); setView("daily"); }}
                    style={{
                      aspectRatio: "1 / 1",
                      minHeight: 52,
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      padding: "6px 7px",
                      textAlign: "left",
                      background: has ? (positive ? "rgba(0,255,136,0.12)" : "rgba(255,77,77,0.12)") : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isToday ? GREEN : has ? (positive ? "rgba(0,255,136,0.3)" : "rgba(255,77,77,0.3)") : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: isToday ? GREEN : "rgba(255,255,255,0.5)" }}>{c.day}</span>
                    {has && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: positive ? GREEN : RED, width: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {money(info.pnl, false)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "14px 0 0", textAlign: "center" }}>
              {calData.monthTrades} trade{calData.monthTrades === 1 ? "" : "s"} this month · tap a day to view it
            </p>
          </div>
        )}

        {/* ---- DAILY VIEW ---- */}
        {view === "daily" && (
          <div style={{ ...glass, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <NavBtn onClick={() => stepDay(-1)}><ChevronLeft size={18} /></NavBtn>
                <span style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 16, minWidth: 150, textAlign: "center" }}>
                  {prettyDate(selectedDate)}{selectedDate === today ? " · Today" : ""}
                </span>
                <NavBtn onClick={() => stepDay(1)}><ChevronRight size={18} /></NavBtn>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 8 }}>
                  Day
                </span>
                <span style={{ color: pnlColor(dayTotal), fontWeight: 700, fontSize: 18 }}>{money(dayTotal)}</span>
              </div>
            </div>

            {dayEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "rgba(255,255,255,0.4)" }}>
                <NotebookPen size={26} style={{ color: "rgba(255,255,255,0.25)", marginBottom: 10 }} />
                <p style={{ margin: "0 0 14px", fontSize: 14 }}>No trades logged for this day.</p>
                <button onClick={openModal} style={{ ...addBtnStyle, padding: "9px 18px" }}>
                  <Plus size={15} /> Add Trade
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dayEntries.map((e) => (
                  <TradeRow key={e.id} e={e} onDelete={() => remove(e.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- ADD TRADE MODAL ---- */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={addEntry}
            style={{ ...glass, width: "100%", maxWidth: 560, padding: 24, marginTop: "6vh", background: "linear-gradient(135deg, rgba(20,28,24,0.96), rgba(12,16,14,0.96))" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ color: "#f5f5f5", fontSize: 20, fontWeight: 700, margin: 0 }}>Log a Trade</h2>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Symbol</label>
                <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="ES, AAPL…" style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>Direction</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["long", "short"] as Direction[]).map((d) => {
                    const active = direction === d;
                    const c = d === "long" ? GREEN : RED;
                    return (
                      <button key={d} type="button" onClick={() => setDirection(d)}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, textTransform: "capitalize", color: active ? c : "rgba(255,255,255,0.4)", background: active ? `${c}1a` : "rgba(255,255,255,0.04)", border: `1px solid ${active ? `${c}55` : "rgba(255,255,255,0.12)"}` }}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Entry</label>
                <input type="number" step="any" value={fEntry} onChange={(e) => setFEntry(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Exit</label>
                <input type="number" step="any" value={fExit} onChange={(e) => setFExit(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Size</label>
                <input type="number" step="any" value={size} onChange={(e) => setSize(e.target.value)} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>
                  P&amp;L{computedPnl !== null && fPnl === "" ? <span style={{ color: pnlColor(computedPnl), fontWeight: 700 }}> · {money(computedPnl)}</span> : null}
                </label>
                <input type="number" step="any" value={fPnl} onChange={(e) => setFPnl(e.target.value)} placeholder={computedPnl !== null ? String(computedPnl) : "auto"} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Setup / Strategy</label>
              <input value={setup} onChange={(e) => setSetup(e.target.value)} placeholder="Breakout, ORB, reversal…" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What happened? What did you learn?" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ padding: "11px 20px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" style={addBtnStyle}>
                <Plus size={16} /> Add Trade
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function pnlColor(v: number) {
  return v > 0 ? GREEN : v < 0 ? RED : "#f5f5f5";
}

const addBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: GREEN,
  color: "#000",
  fontWeight: 700,
  fontSize: 14,
  padding: "11px 22px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 20px rgba(0,255,136,0.25)",
};

function Stat({ label, value, color, glassy }: { label: string; value: string; color: string; glassy?: boolean }) {
  return (
    <div style={glassy ? { ...glass, padding: "16px 18px" } : { background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 18px" }}>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>{label}</p>
      <p style={{ color, fontWeight: 700, fontSize: 22, margin: 0 }}>{value}</p>
    </div>
  );
}

function Toggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: active ? "#000" : "rgba(255,255,255,0.6)", background: active ? GREEN : "transparent" }}>
      {icon} {label}
    </button>
  );
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
      {children}
    </button>
  );
}

function TradeRow({ e, onDelete }: { e: Entry; onDelete: () => void }) {
  const up = e.pnl >= 0;
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${up ? GREEN : RED}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 16 }}>{e.symbol}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: e.direction === "long" ? GREEN : RED, background: `${e.direction === "long" ? GREEN : RED}1a`, padding: "2px 8px", borderRadius: 5, textTransform: "uppercase" }}>
            {e.direction === "long" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {e.direction}
          </span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 6 }}>
          {e.entry || e.exit ? <span>{e.entry} → {e.exit}{e.size ? ` · ${e.size} qty` : ""}</span> : null}
          {e.setup ? <span style={{ marginLeft: e.entry || e.exit ? 8 : 0 }}>· {e.setup}</span> : null}
        </div>
        {e.notes ? <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "8px 0 0", lineHeight: 1.5 }}>{e.notes}</p> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <span style={{ color: up ? GREEN : RED, fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>{money(e.pnl)}</span>
        <button onClick={onDelete} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 2 }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
