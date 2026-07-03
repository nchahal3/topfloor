"use client";

import { useState } from "react";
import { Users, CalendarDays, Calendar, BookOpen, Trophy } from "lucide-react";
import MembersTab, { type Member } from "./MembersTab";
import ScheduleTab from "./ScheduleTab";
import BookingsTab from "./BookingsTab";
import CurriculumTab from "./CurriculumTab";
import AchievementsTab from "./AchievementsTab";

const TABS = [
  { id: "members", label: "Members", icon: Users },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "bookings", label: "1-on-1 Bookings", icon: CalendarDays },
  { id: "curriculum", label: "Curriculum", icon: BookOpen },
  { id: "achievements", label: "Achievements", icon: Trophy },
];

export default function AdminDashboard({ members }: { members: Member[] }) {
  const [activeTab, setActiveTab] = useState("members");
  const [deletedCount, setDeletedCount] = useState(0);

  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 48, margin: 0, lineHeight: 1 }}>
              🔝Floor Admin
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 6, fontSize: 14 }}>
              {members.length - deletedCount} paying member{members.length - deletedCount !== 1 ? "s" : ""}
            </p>
          </div>
          <a href="/api/admin/logout" style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textDecoration: "none", marginTop: 8 }}>
            Logout
          </a>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 18px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${activeTab === id ? "#00ff88" : "transparent"}`,
                color: activeTab === id ? "#00ff88" : "rgba(255,255,255,0.4)",
                fontWeight: activeTab === id ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: -1,
                transition: "color 0.15s",
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ background: "#0a0a0a" }}>
          {activeTab === "members" && <MembersTab members={members} onDelete={() => setDeletedCount((c) => c + 1)} />}
          {activeTab === "schedule" && <ScheduleTab />}
          {activeTab === "bookings" && <BookingsTab />}
          {activeTab === "curriculum" && <CurriculumTab />}
          {activeTab === "achievements" && <AchievementsTab />}
        </div>
      </div>
    </main>
  );
}
